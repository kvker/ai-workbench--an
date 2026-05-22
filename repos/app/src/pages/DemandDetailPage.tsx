import { useCallback, useEffect, useRef, useState } from 'react'
import { App as AntdApp, FloatButton, message, Modal, Radio } from 'antd'
import { useParams } from 'react-router-dom'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import { issueService, taskService, type DocumentSummary, type FlowStep, type HarnessStatus, type IssueTask } from '../services'
import type { DemandIdentity } from '../services/task'
import { pageBand, panel } from '../utils/themeClasses'
import { ArtifactPreviewDialog } from './demand-detail/ArtifactPreviewDialog'
import { ArtifactRegion } from './demand-detail/ArtifactRegion'
import { DemandInfoRegion } from './demand-detail/DemandInfoRegion'
import { DetailDialog } from './demand-detail/DetailDialog'
import { WorkflowRegion } from './demand-detail/WorkflowRegion'
import {
  createDocumentFromStatusFile,
  createEmptyIssueTask,
  createFlowCompletionPrompt,
  loadIssueTask,
} from './demand-detail/demandDetailData'
import {
  demandIdentityOptions,
  getDemandIdentityLabel,
  getDemandIdentityStorageKey,
  readStoredDemandIdentity,
} from './demand-detail/demandDetailIdentity'

const DOCUMENT_REGION_BASE_URL = import.meta.env.VITE_DOCUMENT_REGION_BASE_URL ?? 'http://172.16.4.81:8080/'

type FlowCompletionPromptRequest = {
  key: number
  alias: string
  prompt: string
  focusInput?: boolean
}

// Page: 详情页
export function DemandDetailPage() {
  const { demandId = '' } = useParams()
  const identityStorageKey = getDemandIdentityStorageKey(demandId)
  const initialIdentity = readStoredDemandIdentity(identityStorageKey)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isIdentityOpen, setIsIdentityOpen] = useState(false)
  const [currentIdentity, setCurrentIdentity] = useState<DemandIdentity>(initialIdentity)
  const [pendingIdentity, setPendingIdentity] = useState<DemandIdentity>(initialIdentity)
  const [isSyncingIdentity, setIsSyncingIdentity] = useState(false)
  const [isUpdatingCode, setIsUpdatingCode] = useState(false)
  const [isUploadingRawInput, setIsUploadingRawInput] = useState(false)
  const [isUpdatingHarnessStatus, setIsUpdatingHarnessStatus] = useState(false)
  const [isAnalyzingPmRaw, setIsAnalyzingPmRaw] = useState(false)
  const [isCompletingFlowWithAi, setIsCompletingFlowWithAi] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DocumentSummary | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [activeCodexSessionId, setActiveCodexSessionId] = useState<string | undefined>(undefined)
  const [codexSessionSwitchKey, setCodexSessionSwitchKey] = useState(0)
  const [brainstormSessionRequestKey, setBrainstormSessionRequestKey] = useState(0)
  const [flowCompletionPromptRequest, setFlowCompletionPromptRequest] = useState<FlowCompletionPromptRequest | undefined>(undefined)
  const [artifactRefreshKey, setArtifactRefreshKey] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const rawInputRef = useRef<HTMLInputElement>(null)
  const pendingFlowCompletionRef = useRef<{ step: FlowStep; nextStatus: HarnessStatus } | null>(null)
  const { isDark } = useAppTheme()
  const { modal } = AntdApp.useApp()
  const [messageApi, contextHolder] = message.useMessage()
  const loadTask = useCallback(() => loadIssueTask(demandId), [demandId])
  const { data: task, error, loading } = useIssueTask(loadTask, reloadKey)
  const { issue, workspace, workspaceError, flowSteps } = task
  const artifactRefreshEnabled = !loading && !error && !previewDocument
  const currentFlowStepIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step.status === 'current'),
  )
  const canUploadRawInput = issue.status === 1 || issue.status === 2
  const branch = workspace?.branchName || issue.wsBranchName || `task-${issue.id}`
  const workspaceId = workspace ? String(workspace.id) : ''
  const openRawInputPicker = () => rawInputRef.current?.click()
  const createBrainstormSession = () => setBrainstormSessionRequestKey((value) => value + 1)
  const refreshArtifacts = useCallback(() => {
    setArtifactRefreshKey((value) => value + 1)
  }, [])
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
  const updateHarnessStatus = useCallback(async (harnessStatus: HarnessStatus) => {
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
  }, [issue.id, messageApi])
  const checkFlowComplete = useCallback(async (step: FlowStep) => {
    if (step.harnessStatus === undefined) {
      return false
    }

    const result = await taskService.checkFlowComplete(issue, {
      harnessStatus: step.harnessStatus,
    })

    if (result.allowed) {
      return true
    }

    if (result.statusFile) {
      const statusDocument = createDocumentFromStatusFile(result.statusFile)

      setPreviewDocument(statusDocument)
      setPreviewContent(result.statusFile.content)
      setIsPreviewLoading(false)
    }

    messageApi.warning(result.reason || '状态文件未标记为已完成，暂不能完成该节点')

    return false
  }, [issue, messageApi])
  const requestAiFlowCompletion = (step: FlowStep, nextStatus: HarnessStatus) => {
    pendingFlowCompletionRef.current = { step, nextStatus }
    setIsCompletingFlowWithAi(true)
    setFlowCompletionPromptRequest({
      key: Date.now(),
      alias: `${step.title}完成检查`,
      focusInput: false,
      prompt: createFlowCompletionPrompt({
        branch,
        currentTitle: step.title,
        nextTitle: issueService.harnessStatusTitles[nextStatus],
        workspacePath: workspace?.workspacePath,
      }),
    })
  }
  const handleFlowCompletionPromptFinished = useCallback(async () => {
    const pendingFlowCompletion = pendingFlowCompletionRef.current

    if (!pendingFlowCompletion) {
      return
    }

    pendingFlowCompletionRef.current = null

    try {
      const allowed = await checkFlowComplete(pendingFlowCompletion.step)

      if (!allowed) {
        return
      }

      await updateHarnessStatus(pendingFlowCompletion.nextStatus)
    } finally {
      setIsCompletingFlowWithAi(false)
    }
  }, [checkFlowComplete, updateHarnessStatus])
  const handleCodexError = useCallback(() => {
    pendingFlowCompletionRef.current = null
    setIsCompletingFlowWithAi(false)
  }, [])
  const handlePromptRunCompleted = useCallback(() => {
    void handleFlowCompletionPromptFinished()
  }, [handleFlowCompletionPromptFinished])
  const openDocumentRegion = async () => {
    modal.info({
      title: '打开文档区',
      content: '将在新标签页打开该需求对应的文档区。',
      okText: '打开',
      async onOk() {
        const documentRegionWindow = window.open('about:blank', '_blank')

        try {
          const result = await taskService.openDocumentRegion(issue)
          const documentRegionUrl = new URL(DOCUMENT_REGION_BASE_URL)
          documentRegionUrl.searchParams.set('folder', result.path)

          if (documentRegionWindow) {
            documentRegionWindow.opener = null
            documentRegionWindow.location.href = documentRegionUrl.toString()
          } else {
            window.open(documentRegionUrl.toString(), '_blank', 'noopener,noreferrer')
          }

          messageApi.success('已打开文档区')
        } catch (openError) {
          documentRegionWindow?.close()
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

  const openArtifactPreview = async (document: DocumentSummary) => {
    if (!document.path) {
      messageApi.warning('产物路径为空，暂时无法预览')
      return
    }

    setPreviewDocument(document)
    setPreviewContent('')
    setIsPreviewLoading(true)

    try {
      const preview = await taskService.previewWorkspaceArtifact(issue, document.path)
      setPreviewDocument({ ...document, title: preview.title, path: preview.path })
      setPreviewContent(preview.content)
    } catch (previewError) {
      messageApi.error(previewError instanceof Error ? previewError.message : '产物预览失败')
      setPreviewDocument(null)
    } finally {
      setIsPreviewLoading(false)
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
          isCompletingFlowWithAi={isCompletingFlowWithAi}
          isUpdatingHarnessStatus={isUpdatingHarnessStatus}
          isUploadingRawInput={isUploadingRawInput}
          onAnalyzePmRaw={analyzePmRaw}
          onBrainstorm={createBrainstormSession}
          onCompleteWithAi={requestAiFlowCompletion}
          modal={modal}
          onUpdateHarnessStatus={updateHarnessStatus}
          onUploadRawInput={openRawInputPicker}
        />
        <ArtifactRegion
          initialDocuments={task.documents}
          isDark={isDark}
          issue={issue}
          refreshEnabled={artifactRefreshEnabled}
          refreshKey={artifactRefreshKey}
          onPreviewDocument={openArtifactPreview}
        />
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
        createSessionRequest={brainstormSessionRequestKey ? { key: brainstormSessionRequestKey, alias: '头脑风暴', focusInput: true } : undefined}
        runPromptRequest={flowCompletionPromptRequest}
        onPromptRunCompleted={handlePromptRunCompleted}
        onTurnCompleted={refreshArtifacts}
        onError={handleCodexError}
      />

      <DetailDialog issue={issue} workspacePath={workspace?.workspacePath} branch={branch} open={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <ArtifactPreviewDialog
        content={previewContent}
        document={previewDocument}
        loading={isPreviewLoading}
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
      />
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


function useIssueTask(loader: () => Promise<IssueTask>, reloadKey: number) {
  const [data, setData] = useState<IssueTask>(() => createEmptyIssueTask())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    loader()
      .then((nextData) => {
        if (!active) return
        setLoading(false)
        setData(nextData)
        setError(null)
      })
      .catch((reason) => {
        if (!active) return
        setLoading(false)
        setError(reason instanceof Error ? reason.message : '数据加载失败')
      })

    return () => {
      active = false
    }
  }, [loader, reloadKey])

  return { data, error, loading }
}
