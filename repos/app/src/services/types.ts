export type Tone = 'default' | 'cyan' | 'green' | 'amber' | 'red' | 'blue'

export type FlowStep = {
  sequence?: number
  title: string
  state: string
  status: 'done' | 'current' | 'locked'
  harnessStatus?: HarnessStatus
}

export type DocumentSummary = {
  title: string
  body: string
  tone: Tone
  path?: string
  node?: string
}

export type AuthType = 0 | 1

export type LoginInput = {
  username: string
  password: string
  authType: AuthType
}

export type LoginUser = {
  userId: number
  userName: string
  displayName?: string
  userSource?: number
  gitlabUserId?: number | null
  gitlabUserName?: string | null
  realName?: string
  mobile?: string | null
  nick?: string | null
  dingTalkUserId?: string | null
  yunxiaoAccessToken?: string | null
  token: string
}

export type UserBaseInfo = {
  userId: number
  userName: string
  displayName?: string
  userSource?: number
  gitlabUserId?: number | null
  gitlabUserName?: string | null
  realName?: string
  mobile?: string | null
  nick?: string | null
  dingTalkUserId?: string | null
  yunxiaoAccessToken?: string | null
}

export type IssueStatus = 1 | 2 | 3 | 4

export type HarnessStatus = 'pm' | 'fe' | 'be' | 'qa' | 'archive'

export type IssueType = 1 | 2 | 3 | 4

export type IssueSource = 1 | 2 | 3 | 4

export type IssueTag = 'finance' | 'business' | 'platform' | 'delivery' | 'asset' | 'common'

export type Issue = {
  id: number
  issueName: string
  issueType: IssueType
  issueTypeDesc?: string
  commitTestDoc?: string
  integrationPlanDoc?: string
  prd?: string
  requireDetailUrl?: string
  issueSource: IssueSource
  issueSourceDesc?: string
  status: IssueStatus
  issueStatusDesc?: string
  remark?: string
  createdUser?: string
  createdUserName?: string
  assignedUserName?: string
  assignedUser?: string
  createdAt?: string
  stakeholders?: string[]
  tags?: IssueTag[]
  isHarness?: boolean
  wsBranchName?: string
  harnessStatus?: HarnessStatus
  harnessStatusCode?: string
  harnessStatusDesc?: string
}

export type HarnessIssueGroup = {
  harnessStatus: HarnessStatus
  harnessStatusDesc?: string
  issues: Issue[]
}

export type DeployPlan = {
  id: number
  issueId: number
  issueName?: string
  projectName?: string
  projectCode?: string
  projectConfigId?: number
  gitProjectId?: number
  branchName?: string
  status?: number
  statusDesc?: string
}

export type ProjectConfig = {
  id: number
  projectName: string
  projectCode?: string
  codeRepository?: string
  defaultBranchName?: string
  kind?: string
}

export type CreateDeployPlanInput = {
  issueId: number
  projectConfigId: number
  branchName?: string
  planDeployDate?: string
  reviewUser?: string
  testUser?: string
  remark?: string
}

export type IssueBoard = Issue & {
  deployPlans?: DeployPlan[]
}

export type IssueHarnessListQuery = {
  phases?: HarnessStatus[]
}

export type CreateIssueInput = {
  issueName: string
  issueType: IssueType
  issueSource: IssueSource
  remark?: string
  requireDetailUrl?: string
  assignedUser: string
  stakeholders?: string[]
  tags?: IssueTag[]
  isHarness?: boolean
}

export type UpdateIssueInput = CreateIssueInput & {
  id: number
}

export type LocalWorkspace = {
  id: string
  branchName?: string
  workspaceFolder?: string
  workspacePath?: string
}

export type IssueTask = {
  issue: Issue
  board?: IssueBoard
  deployPlans: DeployPlan[]
  workspace?: LocalWorkspace
  workspaceError?: string
  flowSteps: FlowStep[]
  documents: DocumentSummary[]
}
