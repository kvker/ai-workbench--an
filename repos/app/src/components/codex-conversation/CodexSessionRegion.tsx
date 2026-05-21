import { useEffect, useRef } from 'react'
import { IconButton } from '../Button'
import { renameCodexSession, type CodexSession } from '../../services/codex'
import { dividerBorder, pageBand, panelSoft } from '../../utils/themeClasses'

export function CodexSessionRegion({
  activeSessionId,
  apiBaseUrl,
  disabled,
  isDark,
  onRename,
  onCreateSession,
  onSelectSession,
  sessions,
}: {
  activeSessionId?: string
  apiBaseUrl?: string
  disabled?: boolean
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
        <IconButton disabled={disabled} label="新增会话" onClick={onCreateSession}>+</IconButton>
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
