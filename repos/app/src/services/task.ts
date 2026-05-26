import { request } from './http'
import { getStoredToken } from './authStorage'
import { getWorkspaceUserKey } from './session'
import type { DeployPlan, HarnessStatus, Issue, LocalWorkspace } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://172.16.4.81:3100'

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

  const response = await fetch(`${API_BASE_URL}/api/task/${issue.id}/raw-input?${params.toString()}`, {
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
  status: 'ready'
  path: string
}

export type UpdateFilesResult = {
  status: 'synced' | 'partial' | 'skipped'
  identity: string
  roles?: KnowledgeRole[]
  materials?: KnowledgeMaterialSelection
  knowledgeRootDir: string
  workspacePath: string
  copied?: Array<{ label: string; sourcePath: string; targetPath: string }>
  missing?: Array<{ label: string; sourcePath: string }>
  reason?: string
  workspace?: LocalWorkspace
}

export type KnowledgeRole = 'pm' | 'fe' | 'be' | 'qa'

export type KnowledgeMaterialCategory = 'conventions' | 'agents' | 'skills'

export type KnowledgeMaterialSelection = Record<KnowledgeMaterialCategory, string[]>

export type KnowledgeMaterialItem = {
  id: string
  role?: KnowledgeRole
  sourceDirs: string[]
  targetPath?: string[]
  defaultSelected: boolean
}

export type KnowledgeMaterialGroup = {
  category: KnowledgeMaterialCategory
  items: KnowledgeMaterialItem[]
}

export type KnowledgeMaterialsResult = {
  roles: KnowledgeRole[]
  defaultSelection: KnowledgeMaterialSelection
  groups: KnowledgeMaterialGroup[]
}

export type UpdateMaterialsInput = {
  roles: KnowledgeRole[]
  materials: KnowledgeMaterialSelection
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

export type WorkspaceArtifactPreview = {
  title: string
  path: string
  content: string
  size: number
  updatedAt?: string
}

export type FlowCompleteCheckResult = {
  allowed: boolean
  node: string
  reason?: string
  status?: string
  statusFile?: WorkspaceArtifactFile & {
    content: string
  }
  workspace?: LocalWorkspace
}

export type PrepareDeployPlanRepositoriesResult = {
  status: 'completed' | 'partial' | 'skipped'
  baseDir: string
  repositories: Array<{
    deployPlanId?: number
    projectConfigId?: number
    projectName?: string
    projectCode?: string
    branchName?: string
    repositoryUrl?: string
    localPath?: string
    status: 'cloned' | 'updated' | 'skipped' | 'failed'
    reason?: string
  }>
  workspace?: LocalWorkspace
}

export async function ensureWorkspace(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<LocalWorkspace>(`/api/task/${issue.id}/workspace/ensure?${params.toString()}`, {
    method: 'POST',
  })
}

export async function openDocumentRegion(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<OpenDocumentRegionResult>(`/api/task/${issue.id}/document-region/open?${params.toString()}`, {
    method: 'POST',
  })
}

export async function updateFiles(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<UpdateFilesResult>(`/api/task/${issue.id}/files/update?${params.toString()}`, {
    method: 'POST',
  })
}

export async function listKnowledgeMaterials(issue: Issue, roles: KnowledgeRole[] = []) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  if (roles.length > 0) {
    params.set('roles', roles.join(','))
  }

  return request<KnowledgeMaterialsResult>(`/api/task/${issue.id}/materials?${params.toString()}`, {
    method: 'GET',
  })
}

export async function updateMaterials(issue: Issue, input: UpdateMaterialsInput) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<UpdateFilesResult>(`/api/task/${issue.id}/files/update?${params.toString()}`, {
    body: input,
    method: 'POST',
  })
}

export async function startPmRawAnalysis(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<StartPmRawAnalysisResult>(`/api/task/${issue.id}/pm-raw/analyze?${params.toString()}`, {
    method: 'POST',
  })
}

export async function listWorkspaceArtifacts(issue: Issue) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<WorkspaceArtifactsResult>(`/api/task/${issue.id}/artifacts?${params.toString()}`, {
    method: 'GET',
  })
}

export async function previewWorkspaceArtifact(issue: Issue, artifactPath: string) {
  const params = new URLSearchParams({
    path: artifactPath,
  })
  appendIssueParams(params, issue)

  return request<WorkspaceArtifactPreview>(`/api/task/${issue.id}/artifacts/preview?${params.toString()}`, {
    method: 'GET',
  })
}

export async function checkFlowComplete(issue: Issue, input: { harnessStatus: HarnessStatus; node?: string }) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<FlowCompleteCheckResult>(`/api/task/${issue.id}/flow/complete-check?${params.toString()}`, {
    body: input,
    method: 'POST',
  })
}

export async function prepareDeployPlanRepositories(issue: Issue, deployPlans: DeployPlan[]) {
  const params = new URLSearchParams()
  appendIssueParams(params, issue)

  return request<PrepareDeployPlanRepositoriesResult>(`/api/task/${issue.id}/deploy-plan-repositories/prepare?${params.toString()}`, {
    body: {
      deployPlans,
    },
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
