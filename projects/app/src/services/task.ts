import { request } from './http'
import { getStoredToken } from './authStorage'
import { getWorkspaceUserId } from './session'
import type { Issue } from './types'

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

export async function openDocumentRegion(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<OpenDocumentRegionResult>(`/task/${issue.id}/document-region/open?${params.toString()}`, {
    method: 'POST',
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
