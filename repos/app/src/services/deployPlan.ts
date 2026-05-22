import { request } from './http'
import type { CreateDeployPlanInput, DeployPlan, ProjectConfig } from './types'

const DEVOPS_API_BASE_URL = import.meta.env.VITE_DEVOPS_API_BASE_URL ?? 'http://devops-api.dahuangf.com:8090/devops'

export async function listByIssue(issueId: number | string) {
  return request<DeployPlan[]>(`/deployPlan/list?issueId=${encodeURIComponent(String(issueId))}`, {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function create(input: CreateDeployPlanInput) {
  return request<DeployPlan>('/deployPlan/add', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: input,
    method: 'POST',
  })
}

export async function deleteDeployPlan(deployPlanId: number) {
  return request<boolean>('/deployPlan/delete', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: {
      deployPlanId,
    },
    method: 'DELETE',
  })
}

export async function listAvailableProjects() {
  return request<ProjectConfig[]>('/projectConfig/list', {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function getProjectConfig(projectConfigId: number) {
  return request<ProjectConfig>(`/projectConfig/detail?configId=${encodeURIComponent(String(projectConfigId))}`, {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}
