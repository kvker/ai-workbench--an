export type Tone = 'default' | 'cyan' | 'green' | 'amber' | 'red' | 'blue'

export type Demand = {
  id: string
  title: string
  description: string
  tags: string[]
  status: string
  tone?: Tone
  featured?: boolean
}

export type Lane = {
  title: string
  demands: Demand[]
}

export type FlowStep = {
  title: string
  state: string
  status: 'done' | 'current' | 'locked'
}

export type Message = {
  role: 'user' | 'ai'
  author: string
  body: string
  tools?: { label: string; status: string; tone: Tone }[]
}

export type DemandDetail = {
  id: string
  title: string
  status: string
  priority: string
  owner: string
  source: string
  workspaceFolder: string
  workspacePath?: string
  branch: string
  createdAt: string
  updatedAt: string
}

export type DocumentSummary = {
  title: string
  body: string
  tone: Tone
}

export type ConversationSummary = {
  title: string
  meta: string
  active?: boolean
}

export type CodePreview = {
  lines: string[]
}

export type WorkbenchMockData = {
  workspace: {
    activeDemandId: string
    lanes: Lane[]
  }
  task: {
    demand: DemandDetail
    flowSteps: FlowStep[]
    messages: Message[]
    documents: DocumentSummary[]
    conversations: ConversationSummary[]
    codePreview: CodePreview
  }
  tasksById?: Record<string, WorkbenchMockData['task']>
}

export type CreateDemandInput = {
  title: string
  description: string
  source: '业务方' | '产品方'
  laneTitle?: string
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
