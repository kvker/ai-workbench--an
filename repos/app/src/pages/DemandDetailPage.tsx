import { useCallback, useEffect, useRef, useState } from 'react'
import { FloatButton, message } from 'antd'
import { useParams } from 'react-router-dom'
import { CodexConversationModule } from '../components/codex-conversation/CodexConversationModule'
import { useAppTheme } from '../providers/themeContext'
import {
  deployPlanService,
  issueService,
  taskService,
  userService,
  type DeployPlan,
  type DocumentSummary,
  type FlowStep,
  type IssueTask,
  type ProjectConfig,
  type UpdateIssueInput,
  type UserBaseInfo,
} from '../services'
import type { KnowledgeMaterialSelection, KnowledgeMaterialsResult, KnowledgeRole } from '../services/task'
import { pageBand, panel } from '../utils/themeClasses'
import { ArtifactPreviewDialog } from './demand-detail/ArtifactPreviewDialog'
import { ArtifactRegion } from './demand-detail/ArtifactRegion'
import { DeployPlanDialog } from './demand-detail/DeployPlanDialog'
import { DemandInfoRegion } from './demand-detail/DemandInfoRegion'
import { DetailDialog } from './demand-detail/DetailDialog'
import { EditIssueDialog } from './demand-detail/EditIssueDialog'
import { UpdateMaterialsDialog } from './demand-detail/UpdateMaterialsDialog'
import { WorkflowRegion } from './demand-detail/WorkflowRegion'
import { createEmptyIssueTask, createIssueBranchName, loadIssueTask } from './demand-detail/demandDetailData'

const DOCUMENT_REGION_BASE_URL = import.meta.env.VITE_DOCUMENT_REGION_BASE_URL ?? 'http://172.16.4.81:8080/'
const DEFAULT_MATERIAL_ROLES: KnowledgeRole[] = ['pm']
const EMPTY_MATERIAL_SELECTION: KnowledgeMaterialSelection = {
  conventions: [],
  agents: [],
  skills: [],
}

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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSavingIssue, setIsSavingIssue] = useState(false)
  const [isDeployPlanOpen, setIsDeployPlanOpen] = useState(false)
  const [isCreatingDeployPlan, setIsCreatingDeployPlan] = useState(false)
  const [isUpdateMaterialsOpen, setIsUpdateMaterialsOpen] = useState(false)
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  const [deletingDeployPlanId, setDeletingDeployPlanId] = useState<number | null>(null)
  const [isLoadingDeployPlans, setIsLoadingDeployPlans] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [deployPlanOverride, setDeployPlanOverride] = useState<DeployPlan[] | null>(null)
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [users, setUsers] = useState<UserBaseInfo[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [isUpdatingFiles, setIsUpdatingFiles] = useState(false)
  const [materialRoles, setMaterialRoles] = useState<KnowledgeRole[]>(DEFAULT_MATERIAL_ROLES)
  const [materialSelection, setMaterialSelection] = useState<KnowledgeMaterialSelection>(EMPTY_MATERIAL_SELECTION)
  const [knowledgeMaterials, setKnowledgeMaterials] = useState<KnowledgeMaterialsResult | null>(null)
  const [previewDocument, setPreviewDocument] = useState<DocumentSummary | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [flowCompletionPromptRequest, setFlowCompletionPromptRequest] = useState<FlowCompletionPromptRequest | undefined>(undefined)
  const [artifactRefreshKey, setArtifactRefreshKey] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const { isDark } = useAppTheme()
  const [messageApi, contextHolder] = message.useMessage()
  const preparedDeployPlanKeyRef = useRef('')
  const loadTask = useCallback(() => loadIssueTask(demandId), [demandId])
  const { data: task, error, loading } = useIssueTask(loadTask, reloadKey)
  const { issue, workspace, workspaceError, flowSteps } = task
  const artifactRefreshEnabled = !loading && !error && !previewDocument
  const currentFlowStepIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step.status === 'current'),
  )
  const branch = workspace?.branchName || createIssueBranchName(issue)
  const workspaceId = workspace ? String(workspace.id) : ''
  const deployPlans = deployPlanOverride ?? task.deployPlans
  const refreshArtifacts = useCallback(() => {
    setArtifactRefreshKey((value) => value + 1)
  }, [])
  const loadUsers = useCallback(async () => {
    setUsersLoading(true)

    try {
      setUsers(await userService.listAll())
    } catch (userError) {
      messageApi.error(userError instanceof Error ? userError.message : '用户列表加载失败')
    } finally {
      setUsersLoading(false)
    }
  }, [messageApi])
  const openEditIssue = () => {
    setIsEditOpen(true)
    void loadUsers()
  }
  const saveIssue = async (values: UpdateIssueInput) => {
    setIsSavingIssue(true)

    try {
      await issueService.update({
        ...values,
        id: issue.id,
        requireDetailUrl: values.requireDetailUrl ?? issue.requireDetailUrl,
        stakeholders: values.stakeholders ?? [],
        tags: values.tags ?? [],
        isHarness: values.isHarness ?? issue.isHarness,
      })
      messageApi.success('需求已更新')
      setIsEditOpen(false)
      setReloadKey((value) => value + 1)
    } catch (saveError) {
      messageApi.error(saveError instanceof Error ? saveError.message : '需求更新失败')
    } finally {
      setIsSavingIssue(false)
    }
  }
  const refreshDeployPlans = useCallback(async () => {
    const nextDeployPlans = await deployPlanService.listByIssue(issue.id)
    setDeployPlanOverride(nextDeployPlans)
    return nextDeployPlans
  }, [issue.id])
  const prepareDeployPlanRepositories = useCallback(async (nextDeployPlans: DeployPlan[]) => {
    if (!issue.id || nextDeployPlans.length === 0) return

    try {
      const result = await taskService.prepareDeployPlanRepositories(issue, nextDeployPlans)
      const failedCount = result.repositories.filter((repository) => repository.status === 'failed').length
      const skippedCount = result.repositories.filter((repository) => repository.status === 'skipped').length

      if (failedCount > 0) {
        messageApi.warning(`发布计划仓库准备失败：${formatRepositoryPrepareIssues(result.repositories, 'failed')}`)
      } else if (skippedCount > 0) {
        messageApi.warning(`发布计划仓库已跳过：${formatRepositoryPrepareIssues(result.repositories, 'skipped')}`)
      }
    } catch (prepareError) {
      messageApi.warning(prepareError instanceof Error ? prepareError.message : '发布计划仓库准备失败')
    }
  }, [issue, messageApi])
  useEffect(() => {
    if (loading || error || !issue.id) return

    let active = true

    async function loadAndPrepareDeployPlans() {
      try {
        const nextDeployPlans = await deployPlanService.listByIssue(issue.id)

        if (!active) return

        setDeployPlanOverride(nextDeployPlans)

        const deployPlanKey = nextDeployPlans
          .map((plan) => `${plan.id}:${plan.branchName || ''}`)
          .sort()
          .join('|')

        if (!deployPlanKey || preparedDeployPlanKeyRef.current === deployPlanKey) return

        preparedDeployPlanKeyRef.current = deployPlanKey
        await prepareDeployPlanRepositories(nextDeployPlans)
      } catch (deployPlanError) {
        if (active) {
          messageApi.warning(deployPlanError instanceof Error ? deployPlanError.message : '发布计划列表加载失败')
        }
      }
    }

    void loadAndPrepareDeployPlans()

    return () => {
      active = false
    }
  }, [error, issue.id, loading, messageApi, prepareDeployPlanRepositories])
  const requestWorkflowPrompt = (step: FlowStep, action: 'start' | 'complete') => {
    setFlowCompletionPromptRequest({
      key: Date.now(),
      alias: `${step.title}--${formatCompactDate(new Date())}`,
      focusInput: false,
      prompt: action === 'start' ? 'hello' : 'hi',
    })
  }
  const openDocumentRegion = async () => {
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
  }

  const loadKnowledgeMaterials = useCallback(async (roles: KnowledgeRole[]) => {
    if (!issue.id || roles.length === 0) {
      setKnowledgeMaterials(null)
      setMaterialSelection(EMPTY_MATERIAL_SELECTION)
      return
    }

    setIsLoadingMaterials(true)

    try {
      const result = await taskService.listKnowledgeMaterials(issue, roles)
      setKnowledgeMaterials(result)
      setMaterialSelection(result.defaultSelection)
    } catch (materialError) {
      messageApi.error(materialError instanceof Error ? materialError.message : '物料列表加载失败')
    } finally {
      setIsLoadingMaterials(false)
    }
  }, [issue, messageApi])

  const openUpdateMaterials = () => {
    setIsUpdateMaterialsOpen(true)
    void loadKnowledgeMaterials(materialRoles)
  }

  const changeMaterialRoles = (roles: KnowledgeRole[]) => {
    setMaterialRoles(roles)
    void loadKnowledgeMaterials(roles)
  }

  const updateFiles = async () => {
    setIsUpdatingFiles(true)

    try {
      const result = await taskService.updateMaterials(issue, {
        roles: materialRoles,
        materials: materialSelection,
      })
      const missingCount = result.missing?.length ?? 0

      if (missingCount > 0) {
        messageApi.warning(`物料已部分更新，${missingCount} 类来源缺失`)
      } else {
        messageApi.success('物料已更新')
      }

      setIsUpdateMaterialsOpen(false)
      setReloadKey((value) => value + 1)
    } catch (updateError) {
      messageApi.error(updateError instanceof Error ? updateError.message : '更新物料失败')
    } finally {
      setIsUpdatingFiles(false)
    }
  }

  const openDeployPlans = async () => {
    setIsDeployPlanOpen(true)
    setIsLoadingDeployPlans(true)

    try {
      const nextDeployPlans = await refreshDeployPlans()
      void prepareDeployPlanRepositories(nextDeployPlans)
    } catch (deployPlanError) {
      messageApi.error(deployPlanError instanceof Error ? deployPlanError.message : '发布计划列表加载失败')
    } finally {
      setIsLoadingDeployPlans(false)
    }

    if (projects.length === 0) {
      setIsLoadingProjects(true)
      try {
        setProjects(await deployPlanService.listAvailableProjects())
      } catch (projectError) {
        messageApi.error(projectError instanceof Error ? projectError.message : '工程列表加载失败')
      } finally {
        setIsLoadingProjects(false)
      }
    }
  }

  const createDeployPlan = async (project: ProjectConfig) => {
    setIsCreatingDeployPlan(true)

    try {
      if (await hasSameRepositoryDeployPlan(project, deployPlans)) {
        messageApi.warning('已存在同一个工程的发布计划')
        setIsCreatingDeployPlan(false)
        return
      }

      const createdPlan = await deployPlanService.create({
        issueId: issue.id,
        projectConfigId: project.id,
      })
      setIsCreatingDeployPlan(false)
      messageApi.success('发布计划已创建')
      const nextDeployPlans = await refreshDeployPlans()
      void prepareDeployPlanRepositories(mergeDeployPlans(nextDeployPlans, createdPlan))
    } catch (createError) {
      messageApi.error(createError instanceof Error ? createError.message : '发布计划创建失败')
      setIsCreatingDeployPlan(false)
    }
  }

  const deleteDeployPlan = async (deployPlan: DeployPlan) => {
    setDeletingDeployPlanId(deployPlan.id)

    try {
      await deployPlanService.deleteDeployPlan(deployPlan.id)
      await refreshDeployPlans()
      messageApi.success('发布计划已解除')
    } catch (deleteError) {
      messageApi.error(deleteError instanceof Error ? deleteError.message : '发布计划解除失败')
    } finally {
      setDeletingDeployPlanId(null)
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
          onEditIssue={openEditIssue}
          onOpenDetail={() => setIsDetailOpen(true)}
          onOpenDocumentRegion={openDocumentRegion}
          onOpenDeployPlans={openDeployPlans}
          onUpdateFiles={openUpdateMaterials}
        />
        <UpdateMaterialsDialog
          groups={knowledgeMaterials?.groups ?? []}
          loading={isLoadingMaterials}
          open={isUpdateMaterialsOpen}
          roles={materialRoles}
          selection={materialSelection}
          submitting={isUpdatingFiles}
          onClose={() => setIsUpdateMaterialsOpen(false)}
          onRolesChange={changeMaterialRoles}
          onSelectionChange={setMaterialSelection}
          onSubmit={updateFiles}
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
      <EditIssueDialog
        issue={issue}
        isSaving={isSavingIssue}
        open={isEditOpen}
        users={users}
        usersLoading={usersLoading}
        onCancel={() => setIsEditOpen(false)}
        onSave={saveIssue}
      />
      <DeployPlanDialog
        deployPlans={deployPlans}
        deletingDeployPlanId={deletingDeployPlanId}
        isCreating={isCreatingDeployPlan}
        isDark={isDark}
        loadingDeployPlans={isLoadingDeployPlans}
        loadingProjects={isLoadingProjects}
        open={isDeployPlanOpen}
        projects={projects}
        onClose={() => setIsDeployPlanOpen(false)}
        onCreate={createDeployPlan}
        onDelete={deleteDeployPlan}
      />
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

function formatRepositoryPrepareIssues(
  repositories: taskService.PrepareDeployPlanRepositoriesResult['repositories'],
  status: 'failed' | 'skipped',
) {
  const issues = repositories
    .filter((repository) => repository.status === status)
    .slice(0, 2)
    .map((repository) => `${repository.projectName || repository.projectCode || repository.projectConfigId || '未知工程'}：${repository.reason || '未知原因'}`)

  const remainingCount = repositories.filter((repository) => repository.status === status).length - issues.length
  return `${issues.join('；')}${remainingCount > 0 ? `；另 ${remainingCount} 个` : ''}`
}

function mergeDeployPlans(deployPlans: DeployPlan[], createdPlan: DeployPlan) {
  const deployPlanMap = new Map<number, DeployPlan>()

  for (const deployPlan of deployPlans) {
    deployPlanMap.set(deployPlan.id, deployPlan)
  }

  deployPlanMap.set(createdPlan.id, createdPlan)
  return Array.from(deployPlanMap.values())
}

async function hasSameRepositoryDeployPlan(project: ProjectConfig, deployPlans: DeployPlan[]) {
  const selectedRepository = normalizeRepositoryUrl(project.codeRepository)

  if (!selectedRepository) {
    return false
  }

  const existingProjectConfigIds = deployPlans
    .map((deployPlan) => deployPlan.projectConfigId)
    .filter((projectConfigId): projectConfigId is number => typeof projectConfigId === 'number')

  for (const projectConfigId of existingProjectConfigIds) {
    const existingProject = await deployPlanService.getProjectConfig(projectConfigId)

    if (normalizeRepositoryUrl(existingProject.codeRepository) === selectedRepository) {
      return true
    }
  }

  return false
}

function normalizeRepositoryUrl(repositoryUrl?: string) {
  return String(repositoryUrl || '')
    .trim()
    .replace(/^https:\/\/git\.dahuangf\.com\//, 'ssh://git@git.dahuangf.com:10022/')
    .toLowerCase()
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
