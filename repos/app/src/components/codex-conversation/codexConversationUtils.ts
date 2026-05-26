import type { CodexConversationEvent } from '../../services/codex'

export type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

const selectedSessionStoragePrefix = 'ai-workbench:selected-codex-session:'

export function toConversationMessages(events: CodexConversationEvent[]) {
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

    if (event.type === 'turn.completed' || event.type === 'turn.interrupted' || event.type === 'error') {
      for (const [index, message] of messages.entries()) {
        if (message.streaming) {
          messages[index] = {
            ...message,
            streaming: false,
          }
        }
      }
    }
  }

  return messages
}

export function hasTurnCompleted(events: CodexConversationEvent[]) {
  return events.some((event) => event.type === 'turn.completed' || event.type === 'error')
}

export function isNearScrollBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 80
}

export function upsertEvent(events: CodexConversationEvent[], event: CodexConversationEvent) {
  if (events.some((currentEvent) => currentEvent.id === event.id)) {
    return events
  }

  return [...events, event]
}

export function getCodexActivity({ events, isBusy }: { events: CodexConversationEvent[]; isBusy: boolean }) {
  if (!isBusy) {
    return null
  }

  const lastEvent = [...events].reverse().find((event) => ['command.output', 'diff.updated', 'plan.updated', 'message.delta', 'turn.started'].includes(event.type))

  if (!lastEvent) {
    return 'AI 正在处理...'
  }

  if (lastEvent.type === 'command.output') {
    return 'AI 正在执行命令...'
  }

  if (lastEvent.type === 'diff.updated') {
    return 'AI 正在更新文件...'
  }

  if (lastEvent.type === 'plan.updated') {
    return 'AI 正在规划步骤...'
  }

  if (lastEvent.type === 'message.delta') {
    return 'AI 正在回复...'
  }

  return 'AI 正在处理...'
}

export function readSelectedSessionId(demandId: string, workspaceId: string) {
  return window.localStorage.getItem(getSelectedSessionStorageKey(demandId, workspaceId))
}

export function writeSelectedSessionId(demandId: string, workspaceId: string, sessionId: string) {
  window.localStorage.setItem(getSelectedSessionStorageKey(demandId, workspaceId), sessionId)
}

function getSelectedSessionStorageKey(demandId: string, workspaceId: string) {
  return `${selectedSessionStoragePrefix}${demandId}:${workspaceId}`
}
