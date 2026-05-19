import { request } from './http'
import { mockData } from './mockData'
import type { CreateDemandInput, Demand, WorkbenchMockData } from './types'

export function getActiveDemandId() {
  return mockData.workspace.activeDemandId
}

export async function getWorkspace() {
  return request<WorkbenchMockData['workspace']>('/workspace')
}

export async function listDemandLanes() {
  const workspace = await getWorkspace()
  return workspace.lanes
}

export async function createDemand(input: CreateDemandInput) {
  return request<Demand>('/workspace/demands', {
    method: 'POST',
    body: input,
  })
}
