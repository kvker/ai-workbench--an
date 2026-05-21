import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudSyncOutlined, FileTextOutlined, FolderOpenOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Button, FloatButton, message, Modal, Radio, Steps } from 'antd'
import { useParams } from 'react-router-dom'
import { Pill } from '../components/Pill'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import { issueService, taskService, type DocumentSummary, type FlowStep, type HarnessStatus, type Issue, type IssueTask } from '../services'
import type { DemandIdentity } from '../services/task'
import { mutedText, pageBand, panel } from '../utils/themeClasses'

const emptyIssue: Issue = {
  id: 0,
  issueName: '',
  issueType: 1,
  issueSource: 1,
  status: 1,
}

const demandIdentityOptions: Array<{ label: string; value: DemandIdentity }> = [
  { label: '产品', value: 'pm' },
  { label: '前端', value: 'fe' },
  { label: '后端', value: 'be' },
  { label: '测试', value: 'qa' },
]

// Page: 详情页
export function DemandDetailPage() {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isIdentityOpen, setIsIdentityOpen] = useState(false)
  const [currentIdentity, setCurrentIdentity] = useState<DemandIdentity>('pm')
  const [pendingIdentity, setPendingIdentity] = useState<DemandIdentity>('pm')
  const [isSyncingIdentity, setIsSyncingIdentity] = useState(false)
  const [isUpdatingCode, setIsUpdatingCode] = useState(false)
  const [isUploadingRawInput, setIsUploadingRawInput] = useState(false)
  const [isUpdatingHarnessStatus, setIsUpdatingHarnessStatus] = useState(false)
  const [isAnalyzingPmRaw, setIsAnalyzingPmRaw] = useState(false)
  const [activeCodexSessionId, setActiveCodexSessionId] = useState<string | undefined>(undefined)
  const [codexSessionSwitchKey, setCodexSessionSwitchKey] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const rawInputRef = useRef<HTMLInputElement>(null)
  const { demandId = '' } = useParams()
  const { isDark } = useAppTheme()
  const [messageApi, contextHolder] = message.useMessage()
  const loadTask = useCallback(() => loadIssueTask(demandId), [demandId])
  const { data: task, error, loading } = useIssueTask(loadTask, reloadKey)
  const { issue, workspace, workspaceError, flowSteps, documents } = task
  const identityStorageKey = getDemandIdentityStorageKey(demandId || String(issue.id || ''))
  const currentFlowStepIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step.status === 'current'),
  )
  const canUploadRawInput = issue.status === 1 || issue.status === 2
  const branch = workspace?.branchName || issue.wsBranchName || `task-${issue.id}`
  const workspaceId = workspace ? String(workspace.id) : ''
  const openRawInputPicker = () => rawInputRef.current?.click()
  useEffect(() => {
    const storedIdentity = readStoredDemandIdentity(identityStorageKey)

    setCurrentIdentity(storedIdentity)
    setPendingIdentity(storedIdentity)
  }, [identityStorageKey])

  const openIdentityDialog = () => {
    setPendingIdentity(currentIdentity)
    setIsIdentityOpen(true)
  }
  const switchDemandIdentity = async (identity: DemandIdentity) => {
    await taskService.syncDemandIdentity(issue, identity)
    setCurrentIdentity(identity)
    window.localStorage.setItem(identityStorageKey, identity)
  }
  const confirmIdentitySwitch = async () => {
    setIsSyncingIdentity(true)

    try {
      await switchDemandIdentity(pendingIdentity)
      messageApi.success(`已切换为${getDemandIdentityLabel(pendingIdentity)}身份`)
      setIsIdentityOpen(false)
    } catch (switchError) {
      messageApi.error(switchError instanceof Error ? switchError.message : '切换身份失败')
    } finally {
      setIsSyncingIdentity(false)
    }
  }
  const updateHarnessStatus = async (harnessStatus: HarnessStatus) => {
    if (!issue.id) {
      return
    }

    setIsUpdatingHarnessStatus(true)

    try {
      await issueService.updateHarnessStatus(issue.id, harnessStatus)
      messageApi.success('流程状态已更新')
      setReloadKey((value) => value + 1)
    } catch (updateError) {
      messageApi.error(updateError instanceof Error ? updateError.message : '流程状态更新失败')
    } finally {
      setIsUpdatingHarnessStatus(false)
    }
  }
  const openDocumentRegion = async () => {
    Modal.info({
      title: '打开文档区',
      content: '当前打开该需求在本机工作区中的子工程目录。',
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

  const updateCode = async () => {
    setIsUpdatingCode(true)

    try {
      const result = await taskService.updateCode(issue)
      const failedCount = result.failed?.length ?? 0

      if (failedCount > 0) {
        messageApi.warning(`代码已部分更新，${failedCount} 个仓库失败`)
      } else {
        messageApi.success('代码已更新')
      }

      setReloadKey((value) => value + 1)
    } catch (updateError) {
      messageApi.error(updateError instanceof Error ? updateError.message : '更新代码失败')
    } finally {
      setIsUpdatingCode(false)
    }
  }

  const analyzePmRaw = async () => {
    if (!issue.id) {
      return
    }

    setIsAnalyzingPmRaw(true)

    try {
      const result = await taskService.startPmRawAnalysis(issue)
      const sessionId = result.session?.id

      if (sessionId) {
        setActiveCodexSessionId(sessionId)
        setCodexSessionSwitchKey((value) => value + 1)
      }

      messageApi.success(`需求分析已启动，读取 ${result.inputFileCount} 个原始需求文件`)
      setReloadKey((value) => value + 1)
    } catch (analysisError) {
      messageApi.error(analysisError instanceof Error ? analysisError.message : '需求分析启动失败')
    } finally {
      setIsAnalyzingPmRaw(false)
    }
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
          isUpdatingCode={isUpdatingCode}
          loading={loading}
          currentIdentity={currentIdentity}
          onOpenDetail={() => setIsDetailOpen(true)}
          onOpenDocumentRegion={openDocumentRegion}
          onOpenIdentity={openIdentityDialog}
          onUpdateCode={updateCode}
        />
        <WorkflowRegion
          currentFlowStepIndex={currentFlowStepIndex}
          canUploadRawInput={canUploadRawInput}
          flowSteps={flowSteps}
          issue={issue}
          isDark={isDark}
          isAnalyzingPmRaw={isAnalyzingPmRaw}
          isUpdatingHarnessStatus={isUpdatingHarnessStatus}
          isUploadingRawInput={isUploadingRawInput}
          onAnalyzePmRaw={analyzePmRaw}
          onUpdateHarnessStatus={updateHarnessStatus}
          onUploadRawInput={openRawInputPicker}
        />
        <ArtifactRegion documents={documents} isDark={isDark} />
      </aside>

      <CodexConversationModule
        activeSessionId={activeCodexSessionId}
        branch={branch}
        demandId={String(issue.id)}
        disabled={loading || !workspaceId}
        isDark={isDark}
        initializationError={workspaceError}
        workspaceId={workspaceId}
        workspacePath={workspace?.workspacePath}
        sessionSwitchKey={codexSessionSwitchKey}
      />

      <DetailDialog issue={issue} workspacePath={workspace?.workspacePath} branch={branch} open={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <Modal
        title="切换身份"
        open={isIdentityOpen}
        confirmLoading={isSyncingIdentity}
        okText="切换"
        cancelText="取消"
        onOk={() => void confirmIdentitySwitch()}
        onCancel={() => setIsIdentityOpen(false)}
      >
        <Radio.Group
          className="grid gap-2"
          optionType="button"
          buttonStyle="solid"
          options={demandIdentityOptions}
          value={pendingIdentity}
          onChange={(event) => setPendingIdentity(event.target.value as DemandIdentity)}
        />
      </Modal>
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
  isUpdatingCode,
  loading,
  currentIdentity,
  onOpenDetail,
  onOpenDocumentRegion,
  onOpenIdentity,
  onUpdateCode,
}: {
  issue: Issue
  isDark: boolean
  isUpdatingCode: boolean
  loading: boolean
  currentIdentity: DemandIdentity
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onOpenIdentity: () => void
  onUpdateCode: () => void
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
          <Button size="small" icon={<FolderOpenOutlined />} onClick={onOpenDocumentRegion} className="text-xs font-extrabold">
            打开文档区
          </Button>
          <Button size="small" icon={<UserSwitchOutlined />} onClick={onOpenIdentity} className="text-xs font-extrabold">
            {getDemandIdentityLabel(currentIdentity)}
          </Button>
          <Button size="small" icon={<CloudSyncOutlined />} loading={isUpdatingCode} onClick={onUpdateCode} className="text-xs font-extrabold">
            更新代码
          </Button>
          <Button type="primary" size="small" onClick={onOpenDetail} className="text-xs font-extrabold">
            <FileTextOutlined />
            查看详情
          </Button>
        </div>
      </div>
    </section>
  )
}

function getDemandIdentityLabel(identity: DemandIdentity) {
  return demandIdentityOptions.find((option) => option.value === identity)?.label ?? '产品'
}

function getDemandIdentityStorageKey(demandId: string) {
  return `ai-workbench:demand-identity:${demandId || 'unknown'}`
}

function readStoredDemandIdentity(storageKey: string): DemandIdentity {
  const storedValue = window.localStorage.getItem(storageKey)

  return isDemandIdentity(storedValue) ? storedValue : 'pm'
}

function isDemandIdentity(value: string | null): value is DemandIdentity {
  return demandIdentityOptions.some((option) => option.value === value)
}

function WorkflowRegion({
  currentFlowStepIndex,
  canUploadRawInput,
  flowSteps,
  issue,
  isDark,
  isAnalyzingPmRaw,
  isUpdatingHarnessStatus,
  isUploadingRawInput,
  onAnalyzePmRaw,
  onUpdateHarnessStatus,
  onUploadRawInput,
}: {
  currentFlowStepIndex: number
  canUploadRawInput: boolean
  flowSteps: FlowStep[]
  issue: Issue
  isDark: boolean
  isAnalyzingPmRaw: boolean
  isUpdatingHarnessStatus: boolean
  isUploadingRawInput: boolean
  onAnalyzePmRaw: () => void
  onUpdateHarnessStatus: (harnessStatus: HarnessStatus) => void
  onUploadRawInput: () => void
}) {
  const stepsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = stepsScrollRef.current
    const currentStep = container?.querySelectorAll('.ant-steps-item')[currentFlowStepIndex]

    if (!currentStep) {
      return
    }

    currentStep.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  }, [currentFlowStepIndex, flowSteps.length])

  // Region: 流程区
  return (
    <section className={`grid h-[316px] grid-rows-[auto_minmax(0,1fr)] rounded-lg border p-3 ${panel(isDark)}`}>
      <PanelHead
        title="流程区"
      />
      <div ref={stepsScrollRef} className="min-h-0 overflow-y-auto pr-1">
        <Steps
          orientation="vertical"
          current={currentFlowStepIndex}
          className="mt-3"
          items={flowSteps.map((step, index) => ({
            title: (
              <WorkflowStepTitle
                currentFlowStepIndex={currentFlowStepIndex}
                disabled={!issue.id || isUpdatingHarnessStatus}
                index={index}
                canUploadRawInput={canUploadRawInput}
                isAnalyzingPmRaw={isAnalyzingPmRaw}
                isUploadingRawInput={isUploadingRawInput}
                step={step}
                onAnalyzePmRaw={onAnalyzePmRaw}
                onUpdateHarnessStatus={onUpdateHarnessStatus}
                onUploadRawInput={onUploadRawInput}
              />
            ),
            status: step.status === 'done' ? 'finish' : step.status === 'current' ? 'process' : 'wait',
          }))}
        />
      </div>
    </section>
  )
}

function WorkflowStepTitle({
  currentFlowStepIndex,
  disabled,
  index,
  canUploadRawInput,
  isAnalyzingPmRaw,
  isUploadingRawInput,
  step,
  onAnalyzePmRaw,
  onUpdateHarnessStatus,
  onUploadRawInput,
}: {
  currentFlowStepIndex: number
  disabled: boolean
  index: number
  canUploadRawInput: boolean
  isAnalyzingPmRaw: boolean
  isUploadingRawInput: boolean
  step: FlowStep
  onAnalyzePmRaw: () => void
  onUpdateHarnessStatus: (harnessStatus: HarnessStatus) => void
  onUploadRawInput: () => void
}) {
  const targetStatus = step.harnessStatus
  const isCurrent = index === currentFlowStepIndex
  const isPrevious = index < currentFlowStepIndex
  const nextStatus = issueService.allHarnessStatuses[index + 1]
  const canComplete = isCurrent && nextStatus !== undefined
  const canSwitchBack = isPrevious && targetStatus !== undefined
  const isRequirementAnalysis = step.harnessStatus === 0
  const confirmComplete = () => {
    Modal.confirm({
      title: `确认完成「${step.title}」？`,
      content: nextStatus === undefined ? undefined : `完成后流程会进入「${issueService.harnessStatusTitles[nextStatus]}」。`,
      okText: '完成',
      cancelText: '取消',
      async onOk() {
        // TODO: 完成当前流程状态前需要执行自检；当前仅切换状态，后续接入自检结果后再允许推进。
        onUpdateHarnessStatus(nextStatus)
      },
    })
  }
  const confirmSwitchBack = () => {
    if (targetStatus === undefined) {
      return
    }

    Modal.confirm({
      title: `确认切换回「${step.title}」？`,
      content: '切换后当前流程状态会回退到该节点。',
      okText: '切换',
      cancelText: '取消',
      onOk() {
        onUpdateHarnessStatus(targetStatus)
      },
    })
  }

  return (
    <div className="grid min-w-0 gap-2">
      <span className="truncate text-sm font-extrabold">{step.title}</span>
      <div className="flex flex-wrap gap-2">
        {isRequirementAnalysis && canUploadRawInput && (
          <Button size="small" loading={isUploadingRawInput} onClick={onUploadRawInput}>
            上传需求
          </Button>
        )}
        {isRequirementAnalysis && (
          <Button size="small" loading={isAnalyzingPmRaw} onClick={onAnalyzePmRaw}>
            分析
          </Button>
        )}
        {canComplete && (
          <Button
            size="small"
            type="primary"
            loading={disabled}
            onClick={confirmComplete}
          >
            完成
          </Button>
        )}
        {canSwitchBack && (
          <Button
            size="small"
            disabled={disabled}
            onClick={confirmSwitchBack}
          >
            切换
          </Button>
        )}
      </div>
    </div>
  )
}

function ArtifactRegion({ documents, isDark }: { documents: DocumentSummary[]; isDark: boolean }) {
  // Region: 产物区
  return (
    <section className={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <div className="p-3">
        <PanelHead title="当前产物" action={`${documents.length} docs`} />
      </div>
      <div className="min-h-0 overflow-auto px-3 pb-3">
        {documents.length === 0 && (
          <div className={`border-t border-slate-500/15 py-3 text-xs font-bold ${mutedText(isDark)}`}>
            暂无输出产物
          </div>
        )}
        {documents.map((document) => (
          <QuickDoc key={document.title} title={document.title} body={document.body} />
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

function QuickDoc({ title, body }: { title: string; body: string }) {
  const { isDark } = useAppTheme()

  return (
    <div className="border-t border-slate-500/15 py-3 first:border-t-0">
      <div>
        <div className="break-words text-xs font-extrabold">{title}</div>
        <p className={`mt-1 text-xs leading-relaxed ${mutedText(isDark)}`}>{body}</p>
      </div>
    </div>
  )
}

function PanelHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-extrabold">{title}</h2>
      {typeof action === 'string' ? <Pill tone={action.includes('docs') ? 'cyan' : 'default'}>{action}</Pill> : action}
    </div>
  )
}

function useIssueTask(loader: () => Promise<IssueTask>, reloadKey: number) {
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
  }, [loader, reloadKey])

  return { data, error, loading }
}

async function loadIssueTask(issueId: string): Promise<IssueTask> {
  const issue = await issueService.detail(issueId)
  const [boardResult, workspaceResult, artifactsResult] = await Promise.allSettled([
    issueService.issueBoard(issueId),
    taskService.ensureWorkspace(issue),
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

function getIssueFlowTitle(issue: Issue) {
  if (issue.harnessStatusDesc) {
    return issue.harnessStatusDesc
  }

  if (issue.harnessStatus !== undefined) {
    return issueService.harnessStatusTitles[issue.harnessStatus]
  }

  return issue.issueStatusDesc || issueService.issueStatusTitles[issue.status]
}

function createArtifactDocuments(files: taskService.WorkspaceArtifactFile[]): DocumentSummary[] {
  return files.map((file) => ({
    title: file.title,
    body: `${file.node} / ${formatFileSize(file.size)}${file.updatedAt ? ` / ${formatDateTime(file.updatedAt)}` : ''}`,
    path: file.path,
    node: file.node,
    tone: 'cyan',
  }))
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
