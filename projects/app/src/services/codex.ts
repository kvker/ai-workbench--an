import { getStoredToken } from './authStorage'
import { getWorkspaceUserId } from './session'

const CODEX_API_BASE_URL = import.meta.env.VITE_CODEX_API_BASE_URL ?? 'http://localhost:3100'

export type CodexSession = {
  id: string
  threadId: string
  demandId: string
  workspaceId: string
  cwd: string
  branch: string
  model: string
  effort: string
  approvalPolicy: string
  sandboxMode: string
  networkAccess: boolean
  status: 'idle' | 'running'
  createdAt: string
  updatedAt: string
}

export type CodexPlanStep = {
  text: string
  status: string
}

export type CodexConversationEvent = {
  id: string
  createdAt: string
  type: string
  sessionId?: string
  threadId?: string
  turnId?: string
  itemId?: string
  role?: 'user' | 'assistant'
  text?: string
  steps?: CodexPlanStep[]
  chunk?: string
  requestId?: string
  decision?: string
}

export type CodexSessionEventsResponse = {
  session: CodexSession
  events: CodexConversationEvent[]
}

export type CreateCodexSessionInput = {
  demandId: string
  workspaceId: string
  cwd?: string
  branch?: string
  threadId?: string
  model?: string
  effort?: 'low' | 'medium' | 'high' | 'xhigh'
  metadata?: Record<string, unknown>
}

export type SendCodexTurnInput = {
  text: string
  attachments?: Array<{
    type: 'image' | 'localImage' | 'file' | 'mention'
    path?: string
    url?: string
    name?: string
  }>
}

export async function createCodexSession(input: CreateCodexSessionInput, apiBaseUrl = CODEX_API_BASE_URL) {
  return request<CodexSession>(apiBaseUrl, '/api/codex/sessions', {
    method: 'POST',
    body: input,
  })
}

export async function getCodexEvents(sessionId: string, apiBaseUrl = CODEX_API_BASE_URL) {
  return request<CodexSessionEventsResponse>(apiBaseUrl, `/api/codex/sessions/${sessionId}/events`)
}

export async function sendCodexTurn(sessionId: string, input: SendCodexTurnInput, apiBaseUrl = CODEX_API_BASE_URL) {
  return request<CodexSessionEventsResponse>(apiBaseUrl, `/api/codex/sessions/${sessionId}/turns`, {
    method: 'POST',
    body: input,
  })
}

export async function interruptCodexTurn(sessionId: string, apiBaseUrl = CODEX_API_BASE_URL) {
  return request<CodexSessionEventsResponse>(apiBaseUrl, `/api/codex/sessions/${sessionId}/interrupt`, {
    method: 'POST',
  })
}

async function request<T>(
  apiBaseUrl: string,
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  const token = getStoredToken()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-user-id': getWorkspaceUserId(),
      ...(token ? { token } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Codex request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
