import type { FlowStep, HarnessIssueGroup, HarnessStatus, Issue } from './types'

export type WorkflowStageKey = 'product-planning' | 'frontend-dev' | 'backend-dev' | 'test-acceptance' | 'archive'

export type WorkflowStage = {
  key: WorkflowStageKey
  title: string
  statuses: HarnessStatus[]
}

export const workflowStages: WorkflowStage[] = [
  { key: 'product-planning', title: '产品规划', statuses: ['pm'] },
  { key: 'frontend-dev', title: '前端开发', statuses: ['fe'] },
  { key: 'backend-dev', title: '后端开发', statuses: ['be'] },
  { key: 'test-acceptance', title: '测试验收', statuses: ['qa'] },
  { key: 'archive', title: '归档', statuses: ['archive'] },
]

export const workflowStageTitles = workflowStages.map((stage) => stage.title)

export const workflowHarnessStatuses: HarnessStatus[] = ['pm', 'fe', 'be', 'qa', 'archive']

export function getWorkflowStageTitle(issue: Issue) {
  const harnessStatus = issue.harnessStatus ?? 'pm'

  return getWorkflowStageByHarnessStatus(harnessStatus).title
}

export function createWorkflowSteps(issue: Issue): FlowStep[] {
  const currentStageIndex = getWorkflowStageIndex(issue.harnessStatus ?? 'pm')

  return workflowStages.map((stage, index) => ({
    sequence: index,
    title: stage.title,
    state: index === currentStageIndex ? '当前状态' : index < currentStageIndex ? '已完成' : '未开始',
    status: index === currentStageIndex ? 'current' : index < currentStageIndex ? 'done' : 'locked',
    harnessStatus: stage.statuses[0],
  }))
}

export function createWorkflowGroups(groups: HarnessIssueGroup[]): HarnessIssueGroup[] {
  return workflowStages.map((stage) => {
    const stageIssues = groups
      .filter((group) => stage.statuses.includes(group.harnessStatus))
      .flatMap((group) => group.issues)

    return {
      harnessStatus: stage.statuses[0],
      harnessStatusDesc: stage.title,
      issues: stageIssues,
    }
  })
}

function getWorkflowStageByHarnessStatus(status: HarnessStatus) {
  return workflowStages.find((stage) => stage.statuses.includes(status)) ?? workflowStages[0]
}

function getWorkflowStageIndex(status: HarnessStatus) {
  return workflowStages.findIndex((stage) => stage.statuses.includes(status))
}
