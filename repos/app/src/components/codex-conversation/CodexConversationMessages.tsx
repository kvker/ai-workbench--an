import { Spin } from 'antd'
import ReactMarkdown from 'react-markdown'
import { Avatar } from '../Avatar'
import type { CodexConversationEvent } from '../../services/codex'
import { dividerBorder, mutedText, panel, panelSoft } from '../../utils/themeClasses'
import { toneClass } from '../../utils/toneClasses'
import type { ConversationMessage } from './codexConversationUtils'

export function CodexInitializingState({ isDark }: { isDark: boolean }) {
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

export function CodexErrorState({ error, isDark }: { error: string; isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border px-3 py-2 text-xs font-bold ${panel(isDark)}`}>
      AI service 不可用：{error}
    </div>
  )
}

export function CodexEmptyState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${panel(isDark)}`}>
      <div className="font-extrabold">AI 对话已就绪</div>
      <p className={`mt-2 leading-relaxed ${mutedText(isDark)}`}>当前模块通过 service:3100 创建会话。</p>
    </div>
  )
}

export function CodexMessageBubble({ message, isDark }: { message: ConversationMessage; isDark: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`mb-4 grid max-w-[860px] gap-3 ${isUser ? 'ml-auto grid-cols-[1fr_32px]' : 'grid-cols-[32px_1fr]'}`}>
      {!isUser && <Avatar label="AI" ai />}
      <div className={`rounded-lg border p-3 text-sm leading-relaxed ${isUser ? toneClass('blue', isDark) : panel(isDark)}`}>
        <div className="max-w-none [&_code]:break-words [&_code]:rounded [&_code]:bg-slate-500/10 [&_code]:px-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-slate-950/80 [&_pre]:p-3 [&_pre]:text-slate-100 [&_ul]:ml-5 [&_ul]:list-disc">
          <ReactMarkdown>{message.text}</ReactMarkdown>
          {message.streaming && <span className={mutedText(isDark)}>▍</span>}
        </div>
      </div>
      {isUser && <Avatar label="我" />}
    </div>
  )
}

export function CodexActivityBar({ activity, isDark }: { activity: string; isDark: boolean }) {
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${panelSoft(isDark)}`}>
      <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
      <span>{activity}</span>
    </div>
  )
}

export function CodexPlanPanel({ steps, isDark }: { steps: Array<{ text: string; status: string }>; isDark: boolean }) {
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

export function CodexCommandPanel({
  expanded,
  outputs,
  isDark,
  onToggle,
}: {
  expanded: boolean
  outputs: CodexConversationEvent[]
  isDark: boolean
  onToggle: () => void
}) {
  return (
    <div className={`mb-4 overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-xs font-extrabold ${dividerBorder(isDark)}`}
      >
        <span>命令输出 · {outputs.length} 条</span>
        <span className={mutedText(isDark)}>{expanded ? '收起' : '展开'}</span>
      </button>
      {expanded && (
        <pre className={`max-h-48 overflow-auto whitespace-pre-wrap p-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {outputs.map((output) => output.chunk).join('\n')}
        </pre>
      )}
    </div>
  )
}
