import { useCallback, useRef, useState } from 'react'
import { FileTextOutlined, FolderOpenOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, FloatButton, message, Modal, Steps } from 'antd'
import { useParams } from 'react-router-dom'
import { PrimaryButton } from '../components/Button'
import { Pill } from '../components/Pill'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import { mockData } from '../services/mockData'
import { useAsyncData } from '../services/useAsyncData'
import {
  taskService,
  type DemandDetail,
  type DocumentSummary,
  type FlowStep,
  type Tone,
} from '../services'
import { mutedText, pageBand, panel } from '../utils/themeClasses'

// Page: 详情页
export function DemandDetailPage() {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUploadingRawInput, setIsUploadingRawInput] = useState(false)
  const rawInputRef = useRef<HTMLInputElement>(null)
  const { demandId = '' } = useParams()
  const { isDark } = useAppTheme()
  const [messageApi, contextHolder] = message.useMessage()
  const loadTask = useCallback(() => taskService.getTaskByDemandId(demandId), [demandId])
  const { data: task, loading } = useAsyncData(mockData.task, loadTask)
  const { demand, flowSteps, documents } = task
  const currentFlowStepIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step.status === 'current'),
  )
  const canUploadRawInput = flowSteps[currentFlowStepIndex]?.title === '需求分析'
  const openRawInputPicker = () => rawInputRef.current?.click()
  const openDocumentRegion = async () => {
    Modal.info({
      title: '打开文档区',
      content: '当前先打开本地文档区；未来这里会直接打开 Web 版本的 IDE 编辑器，并定位到该需求的文档目录。',
      okText: '打开',
      async onOk() {
        try {
          await taskService.openDocumentRegion(demand.id)
          messageApi.success('已打开文档区')
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '打开文档区失败')
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
      const result = await taskService.uploadRawInputZip(demand.id, file)
      const uploadedCount = (result.uploaded?.length ?? 0) + (result.overwritten?.length ?? 0)
      const skippedCount = result.skipped?.length ?? 0

      if (uploadedCount === 0 && skippedCount > 0) {
        messageApi.info(`原始需求已存在，跳过 ${skippedCount} 个文件`)
      } else {
        messageApi.success(`已导入 ${uploadedCount} 个文件${skippedCount ? `，跳过 ${skippedCount} 个` : ''}`)
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '上传失败')
    } finally {
      setIsUploadingRawInput(false)
      if (rawInputRef.current) {
        rawInputRef.current.value = ''
      }
    }
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
          demand={demand}
          isDark={isDark}
          canUploadRawInput={canUploadRawInput}
          isUploadingRawInput={isUploadingRawInput}
          onOpenDetail={() => setIsDetailOpen(true)}
          onOpenDocumentRegion={openDocumentRegion}
          onUploadRawInput={openRawInputPicker}
        />
        <WorkflowRegion currentFlowStepIndex={currentFlowStepIndex} flowSteps={flowSteps} isDark={isDark} />
        <ArtifactRegion documents={documents} isDark={isDark} />
      </aside>

      <CodexConversationModule
        branch={demand.branch}
        demandId={demand.id}
        disabled={loading}
        isDark={isDark}
        workspaceId={demand.workspaceFolder}
        workspacePath={demand.workspacePath}
      />

      <DetailDialog demand={demand} open={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <FloatButton
        tooltip="打开代码页"
        className="lg:hidden"
        onClick={() => window.open('https://www.baidu.com', '_blank', 'noreferrer')}
      />
    </section>
  )
}

function DemandInfoRegion({
  demand,
  isDark,
  canUploadRawInput,
  isUploadingRawInput,
  onOpenDetail,
  onOpenDocumentRegion,
  onUploadRawInput,
}: {
  demand: DemandDetail
  isDark: boolean
  canUploadRawInput: boolean
  isUploadingRawInput: boolean
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onUploadRawInput: () => void
}) {
  // Region: 信息区
  return (
    <section className={`rounded-lg border p-3 ${panel(isDark)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-base font-extrabold leading-snug">{demand.title}</div>
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

function DetailDialog({ demand, open, onClose }: { demand: DemandDetail; open: boolean; onClose: () => void }) {
  const { isDark } = useAppTheme()
  const rows = [
    ['需求名', demand.title],
    ['当前状态', demand.status],
    ['需求来源', demand.source],
    ['负责人', demand.owner],
    ['工程文件夹', demand.workspaceFolder],
    ['业务分支', demand.branch],
    ['创建时间', demand.createdAt],
    ['更新时间', demand.updatedAt],
  ]

  return (
    <Modal title="需求详情" open={open} onCancel={onClose} footer={null} width={680}>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className={`rounded-lg border p-3 ${panel(isDark)}`}>
            <div className={`text-xs ${mutedText(isDark)}`}>{label}</div>
            <div className="mt-1 break-words text-sm font-extrabold leading-relaxed">{value}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function QuickDoc({ title, body, tone }: { title: string; body: string; tone: Tone }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-slate-500/15 py-3 first:border-t-0">
      <div>
        <div className="text-xs font-extrabold">{title}</div>
        <p className={`mt-1 text-xs leading-relaxed ${mutedText(false)}`}>{body}</p>
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
