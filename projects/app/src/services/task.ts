import { request } from './http'
import { mockData } from './mockData'
import type { FlowStep, Message, WorkbenchMockData } from './types'

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
