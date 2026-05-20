import { request } from './http'
import type {
  CreateIssueInput,
  DevopsWorkspace,
  HarnessStatus,
  HarnessIssueGroup,
  Issue,
  IssueBoard,
  IssueHarnessListQuery,
  IssueStatus,
} from './types'

const DEVOPS_API_BASE_URL = import.meta.env.VITE_DEVOPS_API_BASE_URL ?? 'http://devops-api.dahuangf.com:8090/devops'

export const issueStatusTitles: Record<IssueStatus, string> = {
  1: '新建',
  2: '处理中',
  3: '完成',
  4: '关闭',
}

export const harnessStatusTitles: Record<HarnessStatus, string> = {
  0: '需求分析',
  1: '原型开发',
  2: '需求交付',
  3: '开发确认',
  4: '编码中',
  5: '开发交付',
  6: '测试确认',
  7: '测试中',
  8: '测试交付',
  9: '归档',
}

export const allHarnessStatuses: HarnessStatus[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export async function listMyHarness(query: IssueHarnessListQuery = {}) {
  return request<HarnessIssueGroup[]>(`/issue/listMyHarness${toHarnessQueryString(query)}`, {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function detail(issueId: number | string) {
  return request<Issue>(`/issue/detail?issueId=${encodeURIComponent(String(issueId))}`, {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function issueBoard(issueId: number | string) {
  return request<IssueBoard>(`/issue/issueBoard?issueId=${encodeURIComponent(String(issueId))}`, {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function create(input: CreateIssueInput) {
  return request<number>('/issue/create', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: input,
    method: 'POST',
  })
}

export async function listWorkspaces() {
  return request<DevopsWorkspace[]>('/ai/workspace/list', {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}

export async function findWorkspaceByIssueId(issueId: number | string) {
  const numericIssueId = Number(issueId)
  const workspaces = await listWorkspaces()

  return workspaces.find((workspace) => workspace.devopsIssueId === numericIssueId)
}

function toHarnessQueryString(query: IssueHarnessListQuery) {
  const params = new URLSearchParams()

  appendListParam(params, 'harnessStatusList', query.harnessStatusList)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function appendListParam(params: URLSearchParams, key: string, values: number[] | undefined) {
  values?.forEach((value) => params.append(key, String(value)))
}
