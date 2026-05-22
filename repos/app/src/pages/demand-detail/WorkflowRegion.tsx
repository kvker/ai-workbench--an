import { useEffect, useRef } from 'react'
import { Button, Steps } from 'antd'
import type { FlowStep, Issue } from '../../services'
import { panel } from '../../utils/themeClasses'
import { PanelHead } from './PanelHead'

const workflowActionButtonClassName = 'h-6 px-2 text-xs font-bold'

export function WorkflowRegion({
  currentFlowStepIndex,
  flowSteps,
  issue,
  isDark,
  isUpdatingHarnessStatus,
  onRunWorkflowPrompt,
}: {
  currentFlowStepIndex: number
  flowSteps: FlowStep[]
  issue: Issue
  isDark: boolean
  isUpdatingHarnessStatus: boolean
  onRunWorkflowPrompt: (step: FlowStep, action: 'start' | 'complete') => void
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
                step={step}
                onRunWorkflowPrompt={onRunWorkflowPrompt}
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
  step,
  onRunWorkflowPrompt,
}: {
  currentFlowStepIndex: number
  disabled: boolean
  index: number
  step: FlowStep
  onRunWorkflowPrompt: (step: FlowStep, action: 'start' | 'complete') => void
}) {
  const isCurrent = index === currentFlowStepIndex
  const canUseActions = !disabled

  return (
    <div className="grid min-w-0 gap-2">
      <span className="truncate text-sm font-extrabold">{step.title}</span>
      {isCurrent && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            className={workflowActionButtonClassName}
            disabled={!canUseActions}
            onClick={() => onRunWorkflowPrompt(step, 'start')}
          >
            开始
          </Button>
          <Button
            size="small"
            type="primary"
            className={workflowActionButtonClassName}
            disabled={!canUseActions}
            onClick={() => onRunWorkflowPrompt(step, 'complete')}
          >
            完成
          </Button>
        </div>
      )}
    </div>
  )
}
