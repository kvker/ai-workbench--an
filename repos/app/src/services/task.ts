import { request } from './http'
import { getStoredToken } from './authStorage'
import { getWorkspaceUserKey } from './session'
import type { Issue, LocalWorkspace } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api'

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

export async function uploadRawInputZip(issue: Issue, file: File, overwriteFiles: string[] = []) {
  const token = getStoredToken()
  const params = new URLSearchParams({
    fileName: file.name,
  })
  appendIssueParams(params, issue)

  if (overwriteFiles.length > 0) {
    params.set('overwriteFiles', overwriteFiles.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/task/${issue.id}/raw-input?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/zip',
      'x-workspace-user': getWorkspaceUserKey(),
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

export type DemandIdentity = 'pm' | 'fe' | 'be' | 'qa'

export type SyncDemandIdentityResult = {
  status: 'synced' | 'partial'
  identity: DemandIdentity
  knowledgeRootDir: string
  workspacePath: string
  copied?: Array<{ label: string; sourcePath: string; targetPath: string }>
  missing?: Array<{ label: string; sourcePath: string }>
  workspace?: LocalWorkspace
}

export type UpdateCodeResult = {
  status: 'updated' | 'partial'
  updated?: Array<{ path: string; branchName: string; stdout?: string; stderr?: string }>
  failed?: Array<{ path: string; message: string }>
  workspace?: LocalWorkspace
}

export type StartPmRawAnalysisResult = {
  status: 'started'
  issueId: string
  issueName?: string
  rawInputDir: string
  skillPath: string
  inputFileCount: number
  session?: { id: string; threadId?: string }
  workspace?: LocalWorkspace
}

export type WorkspaceArtifactFile = {
  title: string
  path: string
  node: string
  size: number
  updatedAt?: string
}

export type WorkspaceArtifactsResult = {
  artifactsRoot: string
  files: WorkspaceArtifactFile[]
  workspace?: LocalWorkspace
}

export async function ensureWorkspace(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<LocalWorkspace>(`/task/${issue.id}/workspace/ensure?${params.toString()}`, {
    method: 'POST',
  })
}

export async function openDocumentRegion(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<OpenDocumentRegionResult>(`/task/${issue.id}/document-region/open?${params.toString()}`, {
    method: 'POST',
  })
}

export async function syncDemandIdentity(issue: Issue, identity: DemandIdentity) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<SyncDemandIdentityResult>(`/task/${issue.id}/identity/sync?${params.toString()}`, {
    method: 'POST',
    body: { identity },
  })
}

export async function updateCode(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<UpdateCodeResult>(`/task/${issue.id}/code/update?${params.toString()}`, {
    method: 'POST',
  })
}

export async function startPmRawAnalysis(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<StartPmRawAnalysisResult>(`/task/${issue.id}/pm-raw/analyze?${params.toString()}`, {
    method: 'POST',
  })
}

export async function listWorkspaceArtifacts(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<WorkspaceArtifactsResult>(`/task/${issue.id}/artifacts?${params.toString()}`, {
    method: 'GET',
  })
}

function appendIssueParams(params: URLSearchParams, issue: Issue) {
  if (issue.issueName) {
    params.set('issueName', issue.issueName)
  }

  if (issue.wsBranchName) {
    params.set('branchName', issue.wsBranchName)
  }
}
