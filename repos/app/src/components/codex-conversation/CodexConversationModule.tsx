import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input } from 'antd'
import { PauseCircleOutlined, SendOutlined } from '@ant-design/icons'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { IconButton } from '../Button'
import {
  createCodexSession,
  getCodexEvents,
  getCodexStreamUrl,
  interruptCodexTurn,
  listCodexSessions,
  sendCodexTurn,
  type CodexConversationEvent,
  type CodexSession,
} from '../../services/codex'
import { dividerBorder, pageBand, panel } from '../../utils/themeClasses'
import {
  CodexActivityBar,
  CodexCommandPanel,
  CodexEmptyState,
  CodexErrorState,
  CodexInitializingState,
  CodexMessageBubble,
  CodexPlanPanel,
} from './CodexConversationMessages'
import { CodexSessionRegion } from './CodexSessionRegion'
import {
  getCodexActivity,
  hasTurnCompleted,
  isNearScrollBottom,
  readSelectedSessionId,
  toConversationMessages,
  upsertEvent,
  writeSelectedSessionId,
} from './codexConversationUtils'

export type CodexConversationModuleProps = {
  demandId: string
  workspaceId: string
  workspacePath?: string
  branch?: string
  threadId?: string
  apiBaseUrl?: string
  disabled?: boolean
  initializationError?: string
  isDark: boolean
  activeSessionId?: string
  sessionSwitchKey?: number
  createSessionRequest?: {
    key: number
    alias: string
    focusInput?: boolean
  }
  runPromptRequest?: {
    key: number
    alias: string
    prompt: string
    focusInput?: boolean
  }
  onThreadChange?: (threadId: string) => void
  onPromptRunStarted?: (session: CodexSession) => void
  onPromptRunCompleted?: (session: CodexSession, events: CodexConversationEvent[]) => void
  onTurnCompleted?: (session: CodexSession, events: CodexConversationEvent[]) => void
  onError?: (error: Error) => void
}

export function CodexConversationModule({
  activeSessionId,
  apiBaseUrl,
  branch,
  createSessionRequest,
  demandId,
  disabled,
  initializationError,
  isDark,
  onError,
  onPromptRunCompleted,
  onPromptRunStarted,
  onThreadChange,
  onTurnCompleted,
  runPromptRequest,
  sessionSwitchKey,
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
  const [commandExpanded, setCommandExpanded] = useState(false)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const draftInputRef = useRef<TextAreaRef | null>(null)
  const handledCreateSessionRequestKeyRef = useRef(0)
  const handledRunPromptRequestKeyRef = useRef(0)
  const pendingPromptRunSessionIdRef = useRef<string | null>(null)
  const handledTurnCompletionIdsRef = useRef(new Set<string>())
  const sessionRef = useRef<CodexSession | null>(null)
  const shouldAutoScrollRef = useRef(true)

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
      if (disabled) {
        setLoading(false)
        setError(initializationError ?? null)
        return
      }

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
        const selectedSessionId = activeSessionId || readSelectedSessionId(demandId, workspaceId)
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
  }, [activeSessionId, apiBaseUrl, branch, demandId, disabled, handleError, initializationError, onThreadChange, sessionSwitchKey, threadId, workspaceId, workspacePath])

  const notifyTurnCompleted = useCallback((completedSession: CodexSession, completedEvents: CodexConversationEvent[]) => {
    const completedEvent = [...completedEvents].reverse().find((event) => event.type === 'turn.completed')

    if (!completedEvent) {
      return
    }

    if (handledTurnCompletionIdsRef.current.has(completedEvent.id)) {
      return
    }

    handledTurnCompletionIdsRef.current.add(completedEvent.id)
    onTurnCompleted?.(completedSession, completedEvents)
  }, [onTurnCompleted])

  const completePromptRun = useCallback((completedSession: CodexSession, completedEvents: CodexConversationEvent[]) => {
    if (pendingPromptRunSessionIdRef.current !== completedSession.id) {
      return
    }

    pendingPromptRunSessionIdRef.current = null
    onPromptRunCompleted?.(completedSession, completedEvents)
  }, [onPromptRunCompleted])

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
          notifyTurnCompleted(response.session, response.events)
          completePromptRun(response.session, response.events)
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
  }, [apiBaseUrl, completePromptRun, handleError, notifyTurnCompleted, pollUntil, session, streamConnected])

  const sessionId = session?.id

  useEffect(() => {
    sessionRef.current = session
  }, [session])

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

      if (hasTurnCompleted(response.events)) {
        notifyTurnCompleted(response.session, response.events)
        completePromptRun(response.session, response.events)
      }
    })
    eventSource.addEventListener('codex-event', (message) => {
      const event = JSON.parse((message as MessageEvent<string>).data) as CodexConversationEvent
      setEvents((currentEvents) => {
        const nextEvents = upsertEvent(currentEvents, event)

        if (event.type === 'turn.completed' || event.type === 'error' || event.type === 'turn.interrupted') {
          const currentSession = sessionRef.current

          if (currentSession) {
            if (event.type === 'turn.completed') {
              notifyTurnCompleted(currentSession, nextEvents)
            }

            completePromptRun(currentSession, nextEvents)
          }
        }

        return nextEvents
      })

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
      const currentSession = sessionRef.current

      if (currentSession?.status === 'running' || pendingPromptRunSessionIdRef.current === currentSession?.id) {
        setPollUntil(Date.now() + 120000)
      } else {
        setPollUntil(0)
      }
    })

    return () => {
      eventSource.close()
      setStreamConnected(false)
    }
  }, [apiBaseUrl, completePromptRun, notifyTurnCompleted, sessionId])

  const messages = useMemo(() => toConversationMessages(events), [events])
  const planSteps = useMemo(() => [...events].reverse().find((event) => event.type === 'plan.updated')?.steps ?? [], [events])
  const commandOutputs = useMemo(() => events.filter((event) => event.type === 'command.output' && event.chunk), [events])
  const activity = useMemo(() => getCodexActivity({ events, isBusy: session?.status === 'running' || sending }), [events, sending, session?.status])
  const hasErrorEvent = useMemo(() => events.some((event) => event.type === 'error'), [events])
  const isBusy = loading || sending || session?.status === 'running'
  const cannotSend = disabled || isBusy || !draft.trim() || !session

  useEffect(() => {
    const messageList = messageListRef.current

    if (!messageList) {
      return
    }

    if (!shouldAutoScrollRef.current) {
      return
    }

    requestAnimationFrame(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'auto',
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

      if (hasTurnCompleted(response.events)) {
        notifyTurnCompleted(response.session, response.events)
        completePromptRun(response.session, response.events)
      }
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

  const focusDraftInput = useCallback(() => {
    window.setTimeout(() => {
      draftInputRef.current?.focus({ cursor: 'end' })
    }, 0)
  }, [])

  const handleCreateSession = useCallback(async (options: { alias?: string; focusInput?: boolean } = {}) => {
    if (disabled) {
      setError(initializationError ?? '需求工作区正在初始化，暂时无法创建 AI 会话。')
      return null
    }

    if (!demandId || !workspaceId) {
      setError('当前需求缺少 demandId 或 workspaceId，无法创建 AI 会话。请先完成需求工作区初始化。')
      return null
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
            alias: options.alias ?? `新会话 ${sessions.length + 1}`,
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

      if (options.focusInput) {
        focusDraftInput()
      }

      return nextSession
    } catch (currentError) {
      handleError(currentError)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, branch, demandId, disabled, focusDraftInput, handleError, initializationError, onThreadChange, sessions.length, workspaceId, workspacePath])

  const runPromptInNewSession = useCallback(async (request: { alias: string; prompt: string; focusInput?: boolean }) => {
    const nextSession = await handleCreateSession({
      alias: request.alias,
      focusInput: request.focusInput,
    })

    if (!nextSession) {
      return
    }

    pendingPromptRunSessionIdRef.current = nextSession.id
    onPromptRunStarted?.(nextSession)
    setSending(true)
    setError(null)

    try {
      const response = await sendCodexTurn(nextSession.id, { text: request.prompt }, apiBaseUrl)
      setSession({ ...response.session, status: 'running' })
      setEvents(response.events)
      setPollUntil(streamConnected ? 0 : Date.now() + 120000)
    } catch (currentError) {
      pendingPromptRunSessionIdRef.current = null
      handleError(currentError)
    } finally {
      setSending(false)
    }
  }, [apiBaseUrl, handleCreateSession, handleError, onPromptRunStarted, streamConnected])

  useEffect(() => {
    if (!createSessionRequest || createSessionRequest.key === handledCreateSessionRequestKeyRef.current) {
      return
    }

    handledCreateSessionRequestKeyRef.current = createSessionRequest.key
    void handleCreateSession({
      alias: createSessionRequest.alias,
      focusInput: createSessionRequest.focusInput,
    })
  }, [createSessionRequest, handleCreateSession])

  useEffect(() => {
    if (!runPromptRequest || runPromptRequest.key === handledRunPromptRequestKeyRef.current) {
      return
    }

    handledRunPromptRequestKeyRef.current = runPromptRequest.key
    void runPromptInNewSession(runPromptRequest)
  }, [runPromptInNewSession, runPromptRequest])

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
        <div
          ref={messageListRef}
          className="min-h-0 overflow-auto p-4"
          onScroll={(event) => {
            shouldAutoScrollRef.current = isNearScrollBottom(event.currentTarget)
          }}
        >
          {loading && <CodexInitializingState isDark={isDark} />}
          {error && <CodexErrorState error={error} isDark={isDark} />}
          {!loading && !messages.length && <CodexEmptyState isDark={isDark} />}
          {messages.map((message) => (
            <CodexMessageBubble key={message.id} message={message} isDark={isDark} />
          ))}
          {activity && <CodexActivityBar activity={activity} isDark={isDark} />}
          {!!planSteps.length && <CodexPlanPanel steps={planSteps} isDark={isDark} />}
          {!!commandOutputs.length && (
            <CodexCommandPanel
              expanded={commandExpanded || hasErrorEvent}
              outputs={commandOutputs}
              isDark={isDark}
              onToggle={() => setCommandExpanded((value) => !value)}
            />
          )}
        </div>

        <div className={`border-t p-4 ${pageBand(isDark)}`}>
          <div className={`overflow-hidden rounded-lg border ${panel(isDark)}`}>
            <Input.TextArea
              ref={draftInputRef}
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
        disabled={disabled}
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
