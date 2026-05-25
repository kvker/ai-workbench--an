import { request } from './http'
import type {
  CreateIssueInput,
  HarnessStatus,
  HarnessIssueGroup,
  Issue,
  IssueBoard,
  IssueHarnessListQuery,
  IssueTag,
  IssueStatus,
  UpdateIssueInput,
} from './types'

const DEVOPS_API_BASE_URL = import.meta.env.VITE_DEVOPS_API_BASE_URL ?? 'http://devops-api.dahuangf.com:8090/devops'

export const issueStatusTitles: Record<IssueStatus, string> = {
  1: '新建',
  2: '处理中',
  3: '完成',
  4: '关闭',
}

export const harnessStatusTitles: Record<HarnessStatus, string> = {
  pm: '产品规划',
  fe: '前端开发',
  be: '后端开发',
  qa: '测试验收',
  archive: '归档',
}

export const allHarnessStatuses: HarnessStatus[] = ['pm', 'fe', 'be', 'qa', 'archive']

export const issueTagOptions: { label: string; value: IssueTag }[] = [
  { label: '财务', value: 'finance' },
  { label: '业务', value: 'business' },
  { label: '平台', value: 'platform' },
  { label: '交付', value: 'delivery' },
  { label: '资管', value: 'asset' },
  { label: '公共', value: 'common' },
]

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

export async function update(input: UpdateIssueInput) {
  return request<boolean>('/issue/update', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: input,
    method: 'POST',
  })
}

export async function updateHarnessStatus(issueId: number | string, harnessStatus: HarnessStatus) {
  return request<boolean>('/issue/updateHarnessStatus', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: {
      issueId: Number(issueId),
      harnessStatus,
    },
    method: 'PUT',
  })
}

function toHarnessQueryString(query: IssueHarnessListQuery) {
  const params = new URLSearchParams()

  if (query.phases && query.phases.length > 0) {
    params.set('phases', query.phases.join(','))
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
