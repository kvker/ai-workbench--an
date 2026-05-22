import { useCallback, useEffect, useState } from 'react'
import { App as AntdApp, FloatButton, message } from 'antd'
import { useParams } from 'react-router-dom'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import { taskService, type DocumentSummary, type FlowStep, type IssueTask } from '../services'
import { pageBand, panel } from '../utils/themeClasses'
import { ArtifactPreviewDialog } from './demand-detail/ArtifactPreviewDialog'
import { ArtifactRegion } from './demand-detail/ArtifactRegion'
import { DemandInfoRegion } from './demand-detail/DemandInfoRegion'
import { DetailDialog } from './demand-detail/DetailDialog'
import { WorkflowRegion } from './demand-detail/WorkflowRegion'
import { createEmptyIssueTask, loadIssueTask } from './demand-detail/demandDetailData'

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
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdatingFiles, setIsUpdatingFiles] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DocumentSummary | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [flowCompletionPromptRequest, setFlowCompletionPromptRequest] = useState<FlowCompletionPromptRequest | undefined>(undefined)
  const [artifactRefreshKey, setArtifactRefreshKey] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
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
  const branch = workspace?.branchName || issue.wsBranchName || `task-${issue.id}`
  const workspaceId = workspace ? String(workspace.id) : ''
  const refreshArtifacts = useCallback(() => {
    setArtifactRefreshKey((value) => value + 1)
  }, [])
  const requestWorkflowPrompt = (step: FlowStep, action: 'start' | 'complete') => {
    setFlowCompletionPromptRequest({
      key: Date.now(),
      alias: `${step.title}--${formatCompactDate(new Date())}`,
      focusInput: false,
      prompt: action === 'start' ? 'hello' : 'hi',
    })
  }
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

  const updateFiles = async () => {
    setIsUpdatingFiles(true)

    try {
      const result = await taskService.updateFiles(issue)
      const missingCount = result.missing?.length ?? 0

      if (missingCount > 0) {
        messageApi.warning(`文件已部分更新，${missingCount} 类来源缺失`)
      } else {
        messageApi.success('文件已更新')
      }

      setReloadKey((value) => value + 1)
    } catch (updateError) {
      messageApi.error(updateError instanceof Error ? updateError.message : '更新文件失败')
    } finally {
      setIsUpdatingFiles(false)
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
      <aside className={`grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 border-b p-4 lg:border-b-0 lg:border-r ${pageBand(isDark)}`}>
        <DemandInfoRegion
          issue={issue}
          isDark={isDark}
          isUpdatingFiles={isUpdatingFiles}
          loading={loading}
          onOpenDetail={() => setIsDetailOpen(true)}
          onOpenDocumentRegion={openDocumentRegion}
          onUpdateFiles={updateFiles}
        />
        <WorkflowRegion
          currentFlowStepIndex={currentFlowStepIndex}
          flowSteps={flowSteps}
          issue={issue}
          isDark={isDark}
          isUpdatingHarnessStatus={false}
          onRunWorkflowPrompt={requestWorkflowPrompt}
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
        branch={branch}
        demandId={String(issue.id)}
        disabled={loading || !workspaceId}
        isDark={isDark}
        initializationError={workspaceError}
        workspaceId={workspaceId}
        workspacePath={workspace?.workspacePath}
        runPromptRequest={flowCompletionPromptRequest}
        onTurnCompleted={refreshArtifacts}
      />

      <DetailDialog issue={issue} workspacePath={workspace?.workspacePath} branch={branch} open={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <ArtifactPreviewDialog
        content={previewContent}
        document={previewDocument}
        loading={isPreviewLoading}
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
      />
      <FloatButton
        tooltip="打开代码页"
        className="lg:hidden"
        onClick={() => window.open(issue.requireDetailUrl || 'about:blank', '_blank', 'noreferrer')}
      />
    </section>
  )
}

function formatCompactDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
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
