import { useCallback, useEffect, useRef, useState } from 'react'
import { FileTextOutlined, FolderOpenOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, FloatButton, message, Modal, Steps } from 'antd'
import { useParams } from 'react-router-dom'
import { PrimaryButton } from '../components/Button'
import { Pill } from '../components/Pill'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import { issueService, taskService, type DocumentSummary, type FlowStep, type Issue, type IssueTask, type Tone } from '../services'
import { mutedText, pageBand, panel } from '../utils/themeClasses'

const emptyIssue: Issue = {
  id: 0,
  issueName: '',
  issueType: 1,
  issueSource: 1,
  status: 1,
}

// Page: 详情页
export function DemandDetailPage() {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUploadingRawInput, setIsUploadingRawInput] = useState(false)
  const rawInputRef = useRef<HTMLInputElement>(null)
  const { demandId = '' } = useParams()
  const { isDark } = useAppTheme()
  const [messageApi, contextHolder] = message.useMessage()
  const loadTask = useCallback(() => loadIssueTask(demandId), [demandId])
  const { data: task, error, loading } = useIssueTask(loadTask)
  const { issue, workspace, flowSteps, documents } = task
  const currentFlowStepIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step.status === 'current'),
  )
  const canUploadRawInput = issue.status === 1 || issue.status === 2
  const branch = workspace?.branchName || issue.wsBranchName || `task-${issue.id}`
  const workspaceId = workspace ? String(workspace.id) : ''
  const openRawInputPicker = () => rawInputRef.current?.click()
  const openDocumentRegion = async () => {
    Modal.info({
      title: '打开文档区',
      content: '当前打开该需求在本机工作区中的文档目录。',
      okText: '打开',
      async onOk() {
        try {
          await taskService.openDocumentRegion(issue)
          messageApi.success('已打开文档区')
        } catch (openError) {
          messageApi.error(openError instanceof Error ? openError.message : '打开文档区失败')
        }
      },
    })
  }

  const uploadRawInput = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      messageApi.error('请上传 zip 文件')
      return
    }

    setIsUploadingRawInput(true)

    try {
      const result = await taskService.uploadRawInputZip(issue, file)
      const uploadedCount = (result.uploaded?.length ?? 0) + (result.overwritten?.length ?? 0)
      const skippedCount = result.skipped?.length ?? 0

      if (uploadedCount === 0 && skippedCount > 0) {
        messageApi.info(`原始需求已存在，跳过 ${skippedCount} 个文件`)
      } else {
        messageApi.success(`已导入 ${uploadedCount} 个文件${skippedCount ? `，跳过 ${skippedCount} 个` : ''}`)
      }
    } catch (uploadError) {
      messageApi.error(uploadError instanceof Error ? uploadError.message : '上传失败')
    } finally {
      setIsUploadingRawInput(false)
      if (rawInputRef.current) {
        rawInputRef.current.value = ''
      }
    }
  }

  if (error && !loading) {
    return (
      <section className={`grid min-h-0 place-items-center p-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-100'}`}>
        <div className={`rounded-lg border px-5 py-4 text-sm font-bold ${panel(isDark)}`}>
          需求详情加载失败：{error}
        </div>
      </section>
    )
  }

  return (
    <section className="grid min-h-0 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
      {contextHolder}
      <input
        ref={rawInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(event) => void uploadRawInput(event.target.files?.[0])}
      />
      <aside className={`grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 border-b p-4 lg:border-b-0 lg:border-r ${pageBand(isDark)}`}>
        <DemandInfoRegion
          issue={issue}
          isDark={isDark}
          canUploadRawInput={canUploadRawInput}
          isUploadingRawInput={isUploadingRawInput}
          loading={loading}
          onOpenDetail={() => setIsDetailOpen(true)}
          onOpenDocumentRegion={openDocumentRegion}
          onUploadRawInput={openRawInputPicker}
        />
        <WorkflowRegion currentFlowStepIndex={currentFlowStepIndex} flowSteps={flowSteps} isDark={isDark} />
        <ArtifactRegion documents={documents} isDark={isDark} />
      </aside>

      <CodexConversationModule
        branch={branch}
        demandId={String(issue.id)}
        disabled={loading || !workspaceId}
        isDark={isDark}
        workspaceId={workspaceId}
        workspacePath={workspace?.workspacePath}
      />

      <DetailDialog issue={issue} workspacePath={workspace?.workspacePath} branch={branch} open={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <FloatButton
        tooltip="打开代码页"
        className="lg:hidden"
        onClick={() => window.open(issue.requireDetailUrl || 'about:blank', '_blank', 'noreferrer')}
      />
    </section>
  )
}

function DemandInfoRegion({
  issue,
  isDark,
  canUploadRawInput,
  isUploadingRawInput,
  loading,
  onOpenDetail,
  onOpenDocumentRegion,
  onUploadRawInput,
}: {
  issue: Issue
  isDark: boolean
  canUploadRawInput: boolean
  isUploadingRawInput: boolean
  loading: boolean
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onUploadRawInput: () => void
}) {
  // Region: 信息区
  return (
    <section className={`rounded-lg border p-3 ${panel(isDark)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-base font-extrabold leading-snug">{loading ? '正在加载...' : issue.issueName}</div>
          <div className={`mt-1 text-xs font-bold ${mutedText(isDark)}`}>
            {getIssueFlowTitle(issue)} / {issue.assignedUserName || issue.assignedUser || '未指派'}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {canUploadRawInput && (
            <Button icon={<UploadOutlined />} loading={isUploadingRawInput} onClick={onUploadRawInput} className="text-xs font-extrabold">
              上传原始需求
            </Button>
          )}
          <Button icon={<FolderOpenOutlined />} onClick={onOpenDocumentRegion} className="text-xs font-extrabold">
            打开文档区
          </Button>
          <PrimaryButton onClick={onOpenDetail}>
            <FileTextOutlined />
            查看详情
          </PrimaryButton>
        </div>
      </div>
    </section>
  )
}

function WorkflowRegion({
  currentFlowStepIndex,
  flowSteps,
  isDark,
}: {
  currentFlowStepIndex: number
  flowSteps: FlowStep[]
  isDark: boolean
}) {
  // Region: 流程区
  return (
    <section className={`grid h-[316px] grid-rows-[auto_minmax(0,1fr)] rounded-lg border p-3 ${panel(isDark)}`}>
      <PanelHead title="流程区" />
      <div className="min-h-0 overflow-y-auto pr-1">
        <Steps
          direction="vertical"
          current={currentFlowStepIndex}
          className="mt-3"
          items={flowSteps.map((step) => ({
            title: step.title,
            description: step.state,
            status: step.status === 'done' ? 'finish' : step.status === 'current' ? 'process' : 'wait',
          }))}
        />
      </div>
    </section>
  )
}

function ArtifactRegion({ documents, isDark }: { documents: DocumentSummary[]; isDark: boolean }) {
  // Region: 产物区
  return (
    <section className={`min-h-0 overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <div className="p-3">
        <PanelHead title="当前产物" action={`${documents.length} docs`} />
      </div>
      <div className="min-h-0 overflow-auto px-3 pb-3">
        {documents.map((document) => (
          <QuickDoc key={document.title} title={document.title} body={document.body} tone={document.tone} />
        ))}
      </div>
    </section>
  )
}

function DetailDialog({
  issue,
  workspacePath,
  branch,
  open,
  onClose,
}: {
  issue: Issue
  workspacePath?: string
  branch: string
  open: boolean
  onClose: () => void
}) {
  const { isDark } = useAppTheme()
  const rows = [
    ['需求名', issue.issueName],
    ['当前状态', issue.issueStatusDesc || issueService.issueStatusTitles[issue.status]],
    ['流程状态', getIssueFlowTitle(issue)],
    ['需求类型', issue.issueTypeDesc],
    ['需求来源', issue.issueSourceDesc],
    ['负责人', issue.assignedUserName || issue.assignedUser],
    ['创建人', issue.createdUserName || issue.createdUser],
    ['工作区分支', branch],
    ['本机路径', workspacePath || '未创建工作区'],
    ['创建时间', issue.createdAt],
    ['详情链接', issue.requireDetailUrl],
  ]

  return (
    <Modal title="需求详情" open={open} onCancel={onClose} footer={null} width={760}>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className={`rounded-lg border p-3 ${panel(isDark)}`}>
            <div className={`text-xs ${mutedText(isDark)}`}>{label}</div>
            <div className="mt-1 break-words text-sm font-extrabold leading-relaxed">{value || '-'}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function QuickDoc({ title, body, tone }: { title: string; body: string; tone: Tone }) {
  const { isDark } = useAppTheme()

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-slate-500/15 py-3 first:border-t-0">
      <div>
        <div className="text-xs font-extrabold">{title}</div>
        <p className={`mt-1 text-xs leading-relaxed ${mutedText(isDark)}`}>{body}</p>
      </div>
      <Pill tone={tone}>{tone === 'cyan' ? '当前' : '完成'}</Pill>
    </div>
  )
}

function PanelHead({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-extrabold">{title}</h2>
      {action && <Pill tone={action.includes('docs') ? 'cyan' : 'default'}>{action}</Pill>}
    </div>
  )
}

function useIssueTask(loader: () => Promise<IssueTask>) {
  const [data, setData] = useState<IssueTask>(() => ({
    issue: emptyIssue,
    flowSteps: createFlowSteps(emptyIssue),
    documents: [],
  }))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    loader()
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setError(null)
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : '数据加载失败')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loader])

  return { data, error, loading }
}

async function loadIssueTask(issueId: string): Promise<IssueTask> {
  const issue = await issueService.detail(issueId)
  const [boardResult, workspaceResult] = await Promise.allSettled([
    issueService.issueBoard(issueId),
    issueService.findWorkspaceByIssueId(issueId),
  ])
  const board = boardResult.status === 'fulfilled' && boardResult.value.id ? boardResult.value : undefined
  const workspace = workspaceResult.status === 'fulfilled' ? workspaceResult.value : undefined
  const displayIssue = board ? { ...issue, ...board } : issue

  return {
    issue: displayIssue,
    board,
    workspace,
    flowSteps: createFlowSteps(displayIssue),
    documents: createDocuments(displayIssue),
  }
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
    title,
    state: current ? '当前状态' : done ? '已完成' : '未开始',
    status: current ? 'current' : done ? 'done' : 'locked',
  }
}

function getIssueFlowTitle(issue: Issue) {
  if (issue.harnessStatusDesc) {
    return issue.harnessStatusDesc
  }

  if (issue.harnessStatus !== undefined) {
    return issueService.harnessStatusTitles[issue.harnessStatus]
  }

  return issue.issueStatusDesc || issueService.issueStatusTitles[issue.status]
}

function createDocuments(issue: Issue): DocumentSummary[] {
  return [
    createDocument('产品需求', issue.prd, 'cyan'),
    createDocument('提测文档', issue.commitTestDoc, 'green'),
    createDocument('发布计划', issue.integrationPlanDoc, 'blue'),
  ].filter((document): document is DocumentSummary => Boolean(document))
}

function createDocument(title: string, body: string | undefined, tone: Tone) {
  if (!body) {
    return null
  }

  return {
    title,
    body,
    tone,
  }
}
