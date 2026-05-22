import { CloseOutlined, PlusOutlined, RocketOutlined } from '@ant-design/icons'
import { Button, Empty, Modal, Popconfirm, Select, Spin } from 'antd'
import { useMemo, useState } from 'react'
import type { DeployPlan, ProjectConfig } from '../../services'
import { mutedText, panel, panelSoft } from '../../utils/themeClasses'

export function DeployPlanDialog({
  deployPlans,
  isCreating,
  isDark,
  deletingDeployPlanId,
  loadingDeployPlans,
  loadingProjects,
  open,
  projects,
  onClose,
  onCreate,
  onDelete,
}: {
  deployPlans: DeployPlan[]
  isCreating: boolean
  isDark: boolean
  deletingDeployPlanId?: number | null
  loadingDeployPlans: boolean
  loadingProjects: boolean
  open: boolean
  projects: ProjectConfig[]
  onClose: () => void
  onCreate: (projectConfig: ProjectConfig) => void
  onDelete: (deployPlan: DeployPlan) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)
  const usedProjectIds = useMemo(
    () => new Set(deployPlans.map((plan) => plan.projectConfigId).filter((id): id is number => typeof id === 'number')),
    [deployPlans],
  )
  const availableProjects = useMemo(
    () => projects.filter((project) => !usedProjectIds.has(project.id)),
    [projects, usedProjectIds],
  )
  const selectedProject = availableProjects.find((project) => project.id === selectedProjectId)

  const createDeployPlan = () => {
    if (!selectedProject) return
    onCreate(selectedProject)
    setSelectedProjectId(undefined)
    setIsAdding(false)
  }

  return (
    <Modal title="发布计划" open={open} onCancel={onClose} footer={null} width={680}>
      <div className="grid gap-3">
        <Spin spinning={loadingDeployPlans}>
          <div className="grid gap-3">
            {deployPlans.length > 0 ? (
              deployPlans.map((plan) => (
                <div key={plan.id} className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] ${panel(isDark)}`}>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold ${mutedText(isDark)}`}>工程</div>
                    <div className="mt-1 break-words text-sm font-extrabold">{plan.projectName || plan.projectCode || '-'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold ${mutedText(isDark)}`}>分支</div>
                    <div className="mt-1 break-all font-mono text-sm font-bold">{plan.branchName || '-'}</div>
                  </div>
                  <Popconfirm
                    title="解除发布计划"
                    description="确认解除这个发布计划吗？"
                    okText="解除"
                    cancelText="取消"
                    onConfirm={() => onDelete(plan)}
                  >
                    <Button
                      aria-label="解除发布计划"
                      danger
                      icon={<CloseOutlined />}
                      loading={deletingDeployPlanId === plan.id}
                      size="small"
                      type="text"
                    />
                  </Popconfirm>
                </div>
              ))
            ) : (
              <div className={`rounded-lg border py-8 ${panelSoft(isDark)}`}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无发布计划" />
              </div>
            )}
          </div>
        </Spin>

        <div className={`rounded-lg border p-3 ${panelSoft(isDark)}`}>
          {isAdding ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Spin spinning={loadingProjects}>
                <Select
                  className="w-full"
                  placeholder="选择工程"
                  value={selectedProjectId}
                  options={availableProjects.map((project) => ({
                    label: project.projectName || project.projectCode || String(project.id),
                    value: project.id,
                  }))}
                  onChange={setSelectedProjectId}
                />
              </Spin>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsAdding(false)}>取消</Button>
                <Button type="primary" icon={<RocketOutlined />} loading={isCreating} disabled={!selectedProject} onClick={createDeployPlan}>
                  创建
                </Button>
              </div>
            </div>
          ) : (
            <Button block icon={<PlusOutlined />} disabled={availableProjects.length === 0} onClick={() => setIsAdding(true)}>
              添加发布计划
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
