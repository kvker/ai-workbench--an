import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Spin } from 'antd'
import { PauseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Avatar } from '../Avatar'
import { IconButton } from '../Button'
import {
  createCodexSession,
  getCodexEvents,
  interruptCodexTurn,
  sendCodexTurn,
  type CodexConversationEvent,
  type CodexSession,
} from '../../services/codex'
import { dividerBorder, mutedText, pageBand, panel, panelSoft } from '../../utils/themeClasses'
import { toneClasses } from '../../utils/toneClasses'

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
}

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
  const [error, setError] = useState<string | null>(null)

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
      setLoading(true)
      setError(null)

      try {
        const nextSession = await createCodexSession(
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

  const messages = useMemo(() => toConversationMessages(events), [events])
  const planSteps = useMemo(() => [...events].reverse().find((event) => event.type === 'plan.updated')?.steps ?? [], [events])
  const commandOutputs = useMemo(() => events.filter((event) => event.type === 'command.output' && event.chunk), [events])
  const isBusy = loading || sending || session?.status === 'running'
  const cannotSend = disabled || isBusy || !draft.trim() || !session

  async function handleSubmit() {
    if (!session || cannotSend) {
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await sendCodexTurn(session.id, { text: draft.trim() }, apiBaseUrl)
      setDraft('')
      setSession(response.session)
      setEvents(response.events)
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

  return (
    <div className={`grid min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] ${isDark ? 'bg-slate-950/70' : 'bg-slate-50/80'}`}>
      <div className="grid min-h-0 grid-rows-[1fr_auto]">
        <div className="min-h-0 overflow-auto p-4">
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
              placeholder={loading ? '正在连接 Codex session...' : '输入消息...'}
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="bg-transparent p-3 text-sm"
              onChange={(event) => setDraft(event.target.value)}
              onPressEnter={(event) => {
                if ((event.metaKey || event.ctrlKey) && !cannotSend) {
                  event.preventDefault()
                  handleSubmit()
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

      <CodexSessionRegion session={session} isDark={isDark} />
    </div>
  )
}

function toConversationMessages(events: CodexConversationEvent[]) {
  return events
    .filter((event): event is CodexConversationEvent & { role: 'user' | 'assistant'; text: string } => {
      return event.type === 'message.completed' && !!event.role && !!event.text
    })
    .map<ConversationMessage>((event) => ({
      id: event.itemId || event.id,
      role: event.role,
      text: event.text,
    }))
}

function CodexInitializingState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`mb-4 grid min-h-[220px] place-items-center rounded-lg border px-6 py-8 ${panel(isDark)}`}>
      <div className="grid max-w-[520px] justify-items-center gap-4 text-center">
        <Spin size="large" />
        <div>
          <div className="text-base font-extrabold">正在连接 Codex session</div>
          <p className={`mt-2 text-sm leading-relaxed ${mutedText(isDark)}`}>
            service 正在绑定当前需求工作区，并准备 Codex 对话上下文。
          </p>
        </div>
      </div>
    </div>
  )
}

function CodexErrorState({ error, isDark }: { error: string; isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border px-3 py-2 text-xs font-bold ${panel(isDark)}`}>
      Codex service 不可用：{error}
    </div>
  )
}

function CodexEmptyState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${panel(isDark)}`}>
      <div className="font-extrabold">Codex 对话已就绪</div>
      <p className={`mt-2 leading-relaxed ${mutedText(isDark)}`}>当前模块通过 service:3100 创建 session，后续可在 service adapter 层切换真实 app-server。</p>
    </div>
  )
}

function CodexMessageBubble({ message, isDark }: { message: ConversationMessage; isDark: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`mb-4 grid max-w-[860px] gap-3 ${isUser ? 'ml-auto grid-cols-[1fr_32px]' : 'grid-cols-[32px_1fr]'}`}>
      {!isUser && <Avatar label="Codex" ai />}
      <div className={`rounded-lg border p-3 text-sm leading-relaxed ${isUser ? toneClasses.blue : panel(isDark)}`}>
        <p>{message.text}</p>
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

function CodexSessionRegion({ session, isDark }: { session: CodexSession | null; isDark: boolean }) {
  // Region: 历史对话区
  return (
    <aside className={`hidden min-h-0 border-l xl:grid xl:grid-rows-[auto_1fr] ${pageBand(isDark)}`}>
      <div className={`border-b p-3 ${dividerBorder(isDark)}`}>
        <h2 className="text-sm font-extrabold">Codex session</h2>
      </div>
      <div className="min-h-0 overflow-auto p-2">
        <div className={`rounded-lg border p-3 ${panelSoft(isDark)}`}>
          <div className="text-xs font-extrabold">{session?.threadId ?? '未连接'}</div>
          <div className={`mt-2 grid gap-2 text-[11px] ${mutedText(isDark)}`}>
            <div>模型：{session?.model ?? '-'}</div>
            <div>权限：{session?.sandboxMode ?? '-'}</div>
            <div>审批：{session?.approvalPolicy ?? '-'}</div>
            <div>联网：{session?.networkAccess ? '开启' : '-'}</div>
            <div className="break-all">工作区：{session?.cwd ?? '-'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
