import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Spin } from 'antd'
import { PauseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Avatar } from '../Avatar'
import { IconButton } from '../Button'
import {
  createCodexSession,
  getCodexEvents,
  getCodexStreamUrl,
  interruptCodexTurn,
  listCodexSessions,
  renameCodexSession,
  sendCodexTurn,
  type CodexConversationEvent,
  type CodexSession,
} from '../../services/codex'
import { dividerBorder, mutedText, pageBand, panel, panelSoft } from '../../utils/themeClasses'
import { toneClass } from '../../utils/toneClasses'

export type CodexConversationModuleProps = {
  demandId: string
  workspaceId: string
  workspacePath?: string
  branch?: string
  threadId?: string
  apiBaseUrl?: string
  disabled?: boolean
  isDark: boolean
  onThreadChange?: (threadId: string) => void
  onError?: (error: Error) => void
}

type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

const selectedSessionStoragePrefix = 'ai-workbench:selected-codex-session:'

export function CodexConversationModule({
  apiBaseUrl,
  branch,
  demandId,
  disabled,
  isDark,
  onError,
  onThreadChange,
  threadId,
  workspaceId,
  workspacePath,
}: CodexConversationModuleProps) {
  const [session, setSession] = useState<CodexSession | null>(null)
  const [events, setEvents] = useState<CodexConversationEvent[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [pollUntil, setPollUntil] = useState(0)
  const [streamConnected, setStreamConnected] = useState(false)
  const [sessions, setSessions] = useState<CodexSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const messageListRef = useRef<HTMLDivElement | null>(null)

  const handleError = useCallback(
    (currentError: unknown) => {
      const normalizedError = currentError instanceof Error ? currentError : new Error(String(currentError))
      setError(normalizedError.message)
      onError?.(normalizedError)
    },
    [onError],
  )

  useEffect(() => {
    let ignore = false

    async function startSession() {
      if (!demandId || !workspaceId) {
        setLoading(false)
        setError('当前需求缺少 demandId 或 workspaceId，无法创建 AI 会话。请先完成需求工作区初始化。')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const existingSessions = await listCodexSessions({ demandId, workspaceId }, apiBaseUrl)
        const sortedSessions = [...existingSessions.sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        const selectedSessionId = readSelectedSessionId(demandId, workspaceId)
        const existingSession = sortedSessions.find((currentSession) => currentSession.id === selectedSessionId) ?? sortedSessions[0]
        const nextSession = existingSession ?? await createCodexSession(
          {
            demandId,
            workspaceId,
            cwd: workspacePath,
            branch,
            threadId,
          },
          apiBaseUrl,
        )

        if (ignore) {
          return
        }

        setSession(nextSession)
        setSessions(existingSession ? sortedSessions : [nextSession, ...sortedSessions])
        writeSelectedSessionId(demandId, workspaceId, nextSession.id)
        onThreadChange?.(nextSession.threadId)

        const response = await getCodexEvents(nextSession.id, apiBaseUrl)

        if (!ignore) {
          setEvents(response.events)
        }
      } catch (currentError) {
        if (!ignore) {
          handleError(currentError)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    startSession()

    return () => {
      ignore = true
    }
  }, [apiBaseUrl, branch, demandId, handleError, onThreadChange, threadId, workspaceId, workspacePath])

  useEffect(() => {
    if (!session || (session.status !== 'running' && Date.now() > pollUntil)) {
      return
    }

    if (streamConnected) {
      return
    }

    let ignore = false
    const timer = window.setInterval(async () => {
      try {
        const response = await getCodexEvents(session.id, apiBaseUrl)

        if (ignore) {
          return
        }

        setSession(response.session)
        setEvents(response.events)

        if (hasTurnCompleted(response.events)) {
          setPollUntil(0)
        }
      } catch (currentError) {
        if (!ignore) {
          handleError(currentError)
        }
      }
    }, 1000)

    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [apiBaseUrl, handleError, pollUntil, session, streamConnected])

  const sessionId = session?.id

  useEffect(() => {
    if (!sessionId) {
      return
    }

    const eventSource = new EventSource(getCodexStreamUrl(sessionId, apiBaseUrl))

    eventSource.addEventListener('open', () => {
      setStreamConnected(true)
    })
    eventSource.addEventListener('snapshot', (message) => {
      const response = JSON.parse((message as MessageEvent<string>).data) as { session: CodexSession; events: CodexConversationEvent[] }
      setSession(response.session)
      setEvents(response.events)
    })
    eventSource.addEventListener('codex-event', (message) => {
      const event = JSON.parse((message as MessageEvent<string>).data) as CodexConversationEvent
      setEvents((currentEvents) => upsertEvent(currentEvents, event))

      if (event.type === 'turn.started') {
        setSession((currentSession) => (currentSession ? { ...currentSession, status: 'running' } : currentSession))
      }

      if (event.type === 'turn.completed' || event.type === 'error' || event.type === 'turn.interrupted') {
        setSession((currentSession) => (currentSession ? { ...currentSession, status: 'idle' } : currentSession))
        setPollUntil(0)
      }
    })
    eventSource.addEventListener('error', () => {
      setStreamConnected(false)
      eventSource.close()
      setPollUntil(Date.now() + 120000)
    })

    return () => {
      eventSource.close()
      setStreamConnected(false)
    }
  }, [apiBaseUrl, sessionId])

  const messages = useMemo(() => toConversationMessages(events), [events])
  const planSteps = useMemo(() => [...events].reverse().find((event) => event.type === 'plan.updated')?.steps ?? [], [events])
  const commandOutputs = useMemo(() => events.filter((event) => event.type === 'command.output' && event.chunk), [events])
  const isBusy = loading || sending || session?.status === 'running'
  const cannotSend = disabled || isBusy || !draft.trim() || !session

  useEffect(() => {
    const messageList = messageListRef.current

    if (!messageList) {
      return
    }

    requestAnimationFrame(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'smooth',
      })
    })
  }, [commandOutputs.length, loading, messages, planSteps.length, sessionId])

  async function handleSubmit() {
    if (!session || cannotSend) {
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await sendCodexTurn(session.id, { text: draft.trim() }, apiBaseUrl)
      setDraft('')
      setSession({ ...response.session, status: 'running' })
      setEvents(response.events)
      setPollUntil(streamConnected ? 0 : Date.now() + 120000)
    } catch (currentError) {
      handleError(currentError)
    } finally {
      setSending(false)
    }
  }

  async function handleInterrupt() {
    if (!session) {
      return
    }

    try {
      const response = await interruptCodexTurn(session.id, apiBaseUrl)
      setSession(response.session)
      setEvents(response.events)
    } catch (currentError) {
      handleError(currentError)
    }
  }

  async function handleCreateSession() {
    if (!demandId || !workspaceId) {
      setError('当前需求缺少 demandId 或 workspaceId，无法创建 AI 会话。请先完成需求工作区初始化。')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextSession = await createCodexSession(
        {
          demandId,
          workspaceId,
          cwd: workspacePath,
          branch,
          metadata: {
            alias: `新会话 ${sessions.length + 1}`,
          },
        },
        apiBaseUrl,
      )

      setSession(nextSession)
      setSessions((currentSessions) => [nextSession, ...currentSessions])
      setEvents(nextSession.events ?? [])
      setDraft('')
      writeSelectedSessionId(demandId, workspaceId, nextSession.id)
      onThreadChange?.(nextSession.threadId)
    } catch (currentError) {
      handleError(currentError)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectSession(nextSession: CodexSession) {
    setSession(nextSession)
    writeSelectedSessionId(demandId, workspaceId, nextSession.id)
    setLoading(true)
    setError(null)

    try {
      const response = await getCodexEvents(nextSession.id, apiBaseUrl)
      setSession(response.session)
      setEvents(response.events)
      onThreadChange?.(response.session.threadId)
    } catch (currentError) {
      handleError(currentError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`grid min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
      <div className="grid min-h-0 grid-rows-[1fr_auto]">
        <div ref={messageListRef} className="min-h-0 overflow-auto p-4">
          {loading && <CodexInitializingState isDark={isDark} />}
          {error && <CodexErrorState error={error} isDark={isDark} />}
          {!loading && !messages.length && <CodexEmptyState isDark={isDark} />}
          {messages.map((message) => (
            <CodexMessageBubble key={message.id} message={message} isDark={isDark} />
          ))}
          {!!planSteps.length && <CodexPlanPanel steps={planSteps} isDark={isDark} />}
          {!!commandOutputs.length && <CodexCommandPanel outputs={commandOutputs} isDark={isDark} />}
        </div>

        <div className={`border-t p-4 ${pageBand(isDark)}`}>
          <div className={`overflow-hidden rounded-lg border ${panel(isDark)}`}>
            <Input.TextArea
              variant="borderless"
              disabled={disabled || loading || !session}
              value={draft}
              placeholder={loading ? '正在连接 AI 会话...' : '输入消息...'}
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="bg-transparent p-3 text-sm"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  if (!cannotSend) {
                    handleSubmit()
                  }
                }
              }}
            />
            <div className={`flex items-center justify-between border-t p-2 ${dividerBorder(isDark)}`}>
              <div className="flex gap-2">
                <IconButton label="引用文档">#</IconButton>
                <IconButton label="选择工具">⌘</IconButton>
              </div>
              <div className="flex gap-2">
                <Button icon={<PauseCircleOutlined />} aria-label="中断" disabled={!session || !isBusy} onClick={handleInterrupt} />
                <Button type="primary" icon={<SendOutlined />} aria-label="发送" disabled={cannotSend} loading={sending} onClick={handleSubmit} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CodexSessionRegion
        activeSessionId={session?.id}
        apiBaseUrl={apiBaseUrl}
        isDark={isDark}
        sessions={sessions}
        onRename={(renamedSession) => {
          setSession((currentSession) => currentSession?.id === renamedSession.id ? renamedSession : currentSession)
          setSessions((currentSessions) => currentSessions.map((currentSession) => (
            currentSession.id === renamedSession.id ? renamedSession : currentSession
          )))
        }}
        onCreateSession={handleCreateSession}
        onSelectSession={handleSelectSession}
      />
    </div>
  )
}

function toConversationMessages(events: CodexConversationEvent[]) {
  const messages: ConversationMessage[] = []
  const streamingMessageIndexById = new Map<string, number>()

  for (const event of events) {
    if (event.type === 'message.delta' && event.itemId && event.text) {
      const existingIndex = streamingMessageIndexById.get(event.itemId)

      if (existingIndex === undefined) {
        streamingMessageIndexById.set(event.itemId, messages.length)
        messages.push({
          id: event.itemId,
          role: 'assistant',
          text: event.text,
          streaming: true,
        })
      } else {
        messages[existingIndex] = {
          ...messages[existingIndex],
          text: `${messages[existingIndex].text}${event.text}`,
        }
      }
    }

    if (event.type === 'message.completed' && event.role && event.text) {
      const messageId = event.itemId || event.id
      const existingIndex = event.itemId ? streamingMessageIndexById.get(event.itemId) : undefined
      const completedMessage: ConversationMessage = {
        id: messageId,
        role: event.role,
        text: event.text,
      }

      if (existingIndex === undefined) {
        messages.push(completedMessage)
      } else {
        messages[existingIndex] = completedMessage
      }
    }
  }

  return messages
}

function hasTurnCompleted(events: CodexConversationEvent[]) {
  return events.some((event) => event.type === 'turn.completed' || event.type === 'error')
}

function upsertEvent(events: CodexConversationEvent[], event: CodexConversationEvent) {
  if (events.some((currentEvent) => currentEvent.id === event.id)) {
    return events
  }

  return [...events, event]
}

function readSelectedSessionId(demandId: string, workspaceId: string) {
  return window.localStorage.getItem(getSelectedSessionStorageKey(demandId, workspaceId))
}

function writeSelectedSessionId(demandId: string, workspaceId: string, sessionId: string) {
  window.localStorage.setItem(getSelectedSessionStorageKey(demandId, workspaceId), sessionId)
}

function getSelectedSessionStorageKey(demandId: string, workspaceId: string) {
  return `${selectedSessionStoragePrefix}${demandId}:${workspaceId}`
}

function CodexInitializingState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`mb-4 grid min-h-[220px] place-items-center rounded-lg border px-6 py-8 ${panel(isDark)}`}>
      <div className="grid max-w-[520px] justify-items-center gap-4 text-center">
        <Spin size="large" />
        <div>
          <div className="text-base font-extrabold">正在连接 AI 会话</div>
          <p className={`mt-2 text-sm leading-relaxed ${mutedText(isDark)}`}>
            service 正在绑定当前需求工作区，并准备 AI 对话上下文。
          </p>
        </div>
      </div>
    </div>
  )
}

function CodexErrorState({ error, isDark }: { error: string; isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border px-3 py-2 text-xs font-bold ${panel(isDark)}`}>
      AI service 不可用：{error}
    </div>
  )
}

function CodexEmptyState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${panel(isDark)}`}>
      <div className="font-extrabold">AI 对话已就绪</div>
      <p className={`mt-2 leading-relaxed ${mutedText(isDark)}`}>当前模块通过 service:3100 创建会话。</p>
    </div>
  )
}

function CodexMessageBubble({ message, isDark }: { message: ConversationMessage; isDark: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`mb-4 grid max-w-[860px] gap-3 ${isUser ? 'ml-auto grid-cols-[1fr_32px]' : 'grid-cols-[32px_1fr]'}`}>
      {!isUser && <Avatar label="AI" ai />}
      <div className={`rounded-lg border p-3 text-sm leading-relaxed ${isUser ? toneClass('blue', isDark) : panel(isDark)}`}>
        <p>
          {message.text}
          {message.streaming && <span className={mutedText(isDark)}>▍</span>}
        </p>
      </div>
      {isUser && <Avatar label="我" />}
    </div>
  )
}

function CodexPlanPanel({ steps, isDark }: { steps: Array<{ text: string; status: string }>; isDark: boolean }) {
  return (
    <div className={`mb-4 overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <div className={`border-b px-3 py-2 text-xs font-extrabold ${dividerBorder(isDark)}`}>执行计划</div>
      {steps.map((step) => (
        <div key={step.text} className="grid grid-cols-[82px_1fr] gap-3 border-t border-slate-500/15 px-3 py-2 first:border-t-0">
          <span className={`text-xs font-bold ${mutedText(isDark)}`}>{step.status}</span>
          <span className="text-sm">{step.text}</span>
        </div>
      ))}
    </div>
  )
}

function CodexCommandPanel({ outputs, isDark }: { outputs: CodexConversationEvent[]; isDark: boolean }) {
  return (
    <div className={`mb-4 overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <div className={`border-b px-3 py-2 text-xs font-extrabold ${dividerBorder(isDark)}`}>命令输出</div>
      <pre className={`max-h-48 overflow-auto whitespace-pre-wrap p-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {outputs.map((output) => output.chunk).join('\n')}
      </pre>
    </div>
  )
}

function CodexSessionRegion({
  activeSessionId,
  apiBaseUrl,
  isDark,
  onRename,
  onCreateSession,
  onSelectSession,
  sessions,
}: {
  activeSessionId?: string
  apiBaseUrl?: string
  isDark: boolean
  onRename: (session: CodexSession) => void
  onCreateSession: () => void
  onSelectSession: (session: CodexSession) => void
  sessions: CodexSession[]
}) {
  // Region: 历史对话区
  return (
    <aside className={`hidden min-h-0 border-l xl:grid xl:grid-rows-[auto_1fr] ${pageBand(isDark)}`}>
      <div className={`flex items-center justify-between gap-3 border-b p-3 ${dividerBorder(isDark)}`}>
        <h2 className="text-sm font-extrabold">AI 会话</h2>
        <IconButton label="新增会话" onClick={onCreateSession}>+</IconButton>
      </div>
      <div className="min-h-0 overflow-auto p-2">
        {sessions.map((session) => (
          <CodexSessionCard
            key={session.id}
            active={session.id === activeSessionId}
            apiBaseUrl={apiBaseUrl}
            isDark={isDark}
            session={session}
            onRename={onRename}
            onSelect={onSelectSession}
          />
        ))}
      </div>
    </aside>
  )
}

function CodexSessionCard({
  active,
  apiBaseUrl,
  isDark,
  onRename,
  onSelect,
  session,
}: {
  active: boolean
  apiBaseUrl?: string
  isDark: boolean
  onRename: (session: CodexSession) => void
  onSelect: (session: CodexSession) => void
  session: CodexSession
}) {
  const title = session.metadata?.alias || session.threadId
  const clickTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  async function handleRename() {
    const alias = window.prompt('设置会话别名', session.metadata?.alias || '')

    if (!alias?.trim()) {
      return
    }

    onRename(await renameCodexSession(session.id, alias.trim(), apiBaseUrl))
  }

  return (
    <button
      type="button"
      title="双击设置别名"
      onClick={(event) => {
        if (event.detail > 1) {
          return
        }

        clickTimerRef.current = window.setTimeout(() => {
          onSelect(session)
          clickTimerRef.current = null
        }, 240)
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (clickTimerRef.current) {
          window.clearTimeout(clickTimerRef.current)
          clickTimerRef.current = null
        }
        handleRename()
      }}
      className={`mb-2 w-full cursor-pointer rounded-lg border p-3 text-left text-xs font-extrabold ${
        active
          ? isDark
            ? 'border-indigo-300/60 bg-slate-900 shadow-[inset_3px_0_0_#818cf8]'
            : 'border-indigo-200 bg-indigo-50 text-indigo-900 shadow-[inset_3px_0_0_#4f46e5]'
          : panelSoft(isDark)
      }`}
    >
      <span className="line-clamp-2 break-words">{title}</span>
    </button>
  )
}
