import { issueService, taskService, type DocumentSummary, type FlowStep, type HarnessStatus, type Issue, type IssueTask } from '../../services'
import { getDemandIdentityStorageKey, readStoredDemandIdentity } from './demandDetailIdentity'

const emptyIssue: Issue = {
  id: 0,
  issueName: '',
  issueType: 1,
  issueSource: 1,
  status: 1,
}

export function createEmptyIssueTask(): IssueTask {
  return {
    issue: emptyIssue,
    flowSteps: createFlowSteps(emptyIssue),
    documents: [],
  }
}

export async function loadIssueTask(issueId: string): Promise<IssueTask> {
  const issue = await issueService.detail(issueId)
  const identity = readStoredDemandIdentity(getDemandIdentityStorageKey(issueId || String(issue.id || '')))
  const [boardResult, workspaceResult, artifactsResult] = await Promise.allSettled([
    issueService.issueBoard(issueId),
    taskService.ensureWorkspace(issue, identity),
    taskService.listWorkspaceArtifacts(issue),
  ])
  const board = boardResult.status === 'fulfilled' && boardResult.value.id ? boardResult.value : undefined
  const workspace = workspaceResult.status === 'fulfilled' ? workspaceResult.value : undefined
  const workspaceError = workspaceResult.status === 'rejected'
    ? workspaceResult.reason instanceof Error
      ? workspaceResult.reason.message
      : '需求工作区初始化失败'
    : undefined
  const displayIssue = board ? { ...issue, ...board } : issue

  return {
    issue: displayIssue,
    board,
    workspace,
    workspaceError,
    flowSteps: createFlowSteps(displayIssue),
    documents: artifactsResult.status === 'fulfilled' ? createArtifactDocuments(artifactsResult.value.files) : [],
  }
}

export function createArtifactDocuments(files: taskService.WorkspaceArtifactFile[]): DocumentSummary[] {
  return files.map((file) => ({
    title: file.title,
    body: `${file.node} / ${formatFileSize(file.size)}${file.updatedAt ? ` / ${formatDateTime(file.updatedAt)}` : ''}`,
    path: file.path,
    node: file.node,
    tone: 'cyan',
  }))
}

export function createDocumentFromStatusFile(file: taskService.WorkspaceArtifactFile): DocumentSummary {
  return {
    title: file.title,
    body: `${file.node} / ${formatFileSize(file.size)}${file.updatedAt ? ` / ${formatDateTime(file.updatedAt)}` : ''}`,
    path: file.path,
    node: file.node,
    tone: 'amber',
  }
}

export function createFlowCompletionPrompt({
  branch,
  currentTitle,
  nextTitle,
  workspacePath,
}: {
  branch: string
  currentTitle: string
  nextTitle: string
  workspacePath?: string
}) {
  const pmRawDir = workspacePath ? `${workspacePath}/artifacts/${branch}/pm-raw` : `artifacts/${branch}/pm-raw`

  return [
    '请使用 pm-raw skill 复查当前需求分析产物是否可以进行状态变化至已完成。',
    '',
    `当前流程节点：${currentTitle}`,
    `目标下一节点：${nextTitle}`,
    `pm-raw 目录：${pmRawDir}`,
    '',
    '请按 pm-raw skill 的规则检查 pm-raw 目录下已有产物，并更新 pm-raw/raw-status.md。',
    '如果复查后满足完成条件，请让 raw-status.md 的正文中明确包含“已完成”。',
    '如果不满足，请在 raw-status.md 中说明不能完成的原因，且不要写入“已完成”。',
    '只需要更新状态文档，不要修改需求系统状态。',
  ].join('\n')
}

export function getIssueFlowTitle(issue: Issue) {
  if (issue.harnessStatusDesc) {
    return issue.harnessStatusDesc
  }

  if (issue.harnessStatus !== undefined) {
    return issueService.harnessStatusTitles[issue.harnessStatus]
  }

  return issue.issueStatusDesc || issueService.issueStatusTitles[issue.status]
}

function createFlowSteps(issue: Issue): FlowStep[] {
  return Object.entries(issueService.harnessStatusTitles).map(([status, title]) =>
    createFlowStep(Number(status), title, issue.harnessStatus ?? 0),
  )
}

function createFlowStep(targetStatus: number, title: string, currentStatus: number): FlowStep {
  const done = currentStatus > targetStatus
  const current = currentStatus === targetStatus

  return {
    sequence: targetStatus,
    harnessStatus: targetStatus as HarnessStatus,
    title,
    state: current ? '当前状态' : done ? '已完成' : '未开始',
    status: current ? 'current' : done ? 'done' : 'locked',
  }
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}
