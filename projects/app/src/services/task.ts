import { request } from './http'
import { getStoredToken } from './authStorage'
import { mockData } from './mockData'
import { getWorkspaceUserId } from './session'
import type { FlowStep, Message, WorkbenchMockData } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api'

export function getMockTask() {
  return mockData.task
}

export async function getTask() {
  return request<WorkbenchMockData['task']>('/task')
}

export async function getTaskByDemandId(demandId: string) {
  return request<WorkbenchMockData['task']>(`/task/${demandId}`)
}

export async function getDemandDetail() {
  const task = await getTask()
  return task.demand
}

export async function listFlowSteps() {
  const task = await getTask()
  return task.flowSteps
}

export async function listMessages() {
  const task = await getTask()
  return task.messages
}

export async function listDocuments() {
  const task = await getTask()
  return task.documents
}

export async function listConversations() {
  const task = await getTask()
  return task.conversations
}

export async function getCodePreview() {
  const task = await getTask()
  return task.codePreview
}

export async function appendMessage(message: Message) {
  return request<Message[]>('/task/messages', {
    method: 'POST',
    body: message,
  })
}

export async function updateFlowSteps(flowSteps: FlowStep[]) {
  return request<FlowStep[]>('/task/flow-steps', {
    method: 'PUT',
    body: flowSteps,
  })
}

export type UploadRawInputResult = {
  status: 'uploaded' | 'skipped' | 'overwritten'
  fileName?: string
  size?: number
  tmpZipPath?: string
  targetDir?: string
  uploaded?: string[]
  skipped?: string[]
  overwritten?: string[]
  message?: string
}

export async function uploadRawInputZip(demandId: string, file: File, overwriteFiles: string[] = []) {
  const token = getStoredToken()
  const params = new URLSearchParams({
    fileName: file.name,
  })

  if (overwriteFiles.length > 0) {
    params.set('overwriteFiles', overwriteFiles.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/task/${demandId}/raw-input?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/zip',
      'x-workspace-user-id': getWorkspaceUserId(),
      ...(token ? { token } : {}),
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<UploadRawInputResult>
}

export type OpenDocumentRegionResult = {
  status: 'opened'
  path: string
}

export async function openDocumentRegion(demandId: string) {
  return request<OpenDocumentRegionResult>(`/task/${demandId}/document-region/open`, {
    method: 'POST',
  })
}
