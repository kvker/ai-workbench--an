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

export type HarnessStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type IssueType = 1 | 2 | 3 | 4

export type IssueSource = 1 | 2 | 3 | 4

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
  branchName?: string
  status?: number
  statusDesc?: string
}

export type IssueBoard = Issue & {
  deployPlans?: DeployPlan[]
}

export type IssueHarnessListQuery = {
  harnessStatusList?: HarnessStatus[]
}

export type CreateIssueInput = {
  issueName: string
  issueType: IssueType
  issueSource: IssueSource
  remark?: string
  requireDetailUrl?: string
  assignedUser: string
  stakeholders?: string[]
  isHarness?: boolean
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
  workspace?: LocalWorkspace
  workspaceError?: string
  flowSteps: FlowStep[]
  documents: DocumentSummary[]
}
