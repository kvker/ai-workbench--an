import { useEffect, useRef } from 'react'
import { App as AntdApp, Button, Steps } from 'antd'
import { issueService, type FlowStep, type HarnessStatus, type Issue } from '../../services'
import { panel } from '../../utils/themeClasses'
import { PanelHead } from './PanelHead'

const workflowActionButtonClassName = 'h-6 px-2 text-xs font-bold'

export function WorkflowRegion({
  currentFlowStepIndex,
  canUploadRawInput,
  flowSteps,
  issue,
  isDark,
  isAnalyzingPmRaw,
  isCompletingFlowWithAi,
  isUpdatingHarnessStatus,
  isUploadingRawInput,
  onAnalyzePmRaw,
  onBrainstorm,
  onCompleteWithAi,
  modal,
  onUpdateHarnessStatus,
  onUploadRawInput,
}: {
  currentFlowStepIndex: number
  canUploadRawInput: boolean
  flowSteps: FlowStep[]
  issue: Issue
  isDark: boolean
  isAnalyzingPmRaw: boolean
  isCompletingFlowWithAi: boolean
  isUpdatingHarnessStatus: boolean
  isUploadingRawInput: boolean
  onAnalyzePmRaw: () => void
  onBrainstorm: () => void
  onCompleteWithAi: (step: FlowStep, nextStatus: HarnessStatus) => void
  modal: ReturnType<typeof AntdApp.useApp>['modal']
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

  return (
    <section className={`grid h-[316px] grid-rows-[auto_minmax(0,1fr)] rounded-lg border p-3 ${panel(isDark)}`}>
      <PanelHead title="流程区" />
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
                isCompletingFlowWithAi={isCompletingFlowWithAi}
                isUploadingRawInput={isUploadingRawInput}
                step={step}
                onAnalyzePmRaw={onAnalyzePmRaw}
                onBrainstorm={onBrainstorm}
                onCompleteWithAi={onCompleteWithAi}
                modal={modal}
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
  isCompletingFlowWithAi,
  isUploadingRawInput,
  step,
  onAnalyzePmRaw,
  onBrainstorm,
  onCompleteWithAi,
  modal,
  onUpdateHarnessStatus,
  onUploadRawInput,
}: {
  currentFlowStepIndex: number
  disabled: boolean
  index: number
  canUploadRawInput: boolean
  isAnalyzingPmRaw: boolean
  isCompletingFlowWithAi: boolean
  isUploadingRawInput: boolean
  step: FlowStep
  onAnalyzePmRaw: () => void
  onBrainstorm: () => void
  onCompleteWithAi: (step: FlowStep, nextStatus: HarnessStatus) => void
  modal: ReturnType<typeof AntdApp.useApp>['modal']
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
    modal.confirm({
      title: `确认完成「${step.title}」？`,
      content: nextStatus === undefined ? undefined : `完成后流程会进入「${issueService.harnessStatusTitles[nextStatus]}」。`,
      okText: '完成',
      cancelText: '取消',
      async onOk() {
        onCompleteWithAi(step, nextStatus)
      },
    })
  }
  const confirmSwitchBack = () => {
    if (targetStatus === undefined) {
      return
    }

    modal.confirm({
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
          <Button size="small" className={workflowActionButtonClassName} loading={isUploadingRawInput} onClick={onUploadRawInput}>
            上传需求
          </Button>
        )}
        {isRequirementAnalysis && (
          <Button size="small" className={workflowActionButtonClassName} loading={isAnalyzingPmRaw} onClick={onAnalyzePmRaw}>
            需求分析
          </Button>
        )}
        {isRequirementAnalysis && (
          <Button size="small" className={workflowActionButtonClassName} disabled={disabled} onClick={onBrainstorm}>
            头脑风暴
          </Button>
        )}
        {canComplete && (
          <Button
            size="small"
            type="primary"
            className={workflowActionButtonClassName}
            loading={disabled || isCompletingFlowWithAi}
            onClick={confirmComplete}
          >
            完成
          </Button>
        )}
        {canSwitchBack && (
          <Button
            size="small"
            className={workflowActionButtonClassName}
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
