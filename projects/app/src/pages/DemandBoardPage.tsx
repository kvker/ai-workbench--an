import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Form, Input, Modal, Radio, Segmented, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CREATE_DEMAND_EVENT } from '../components/Topbar'
import { useAppTheme } from '../providers/themeContext'
import { authService, issueService, userService, type CreateIssueInput, type HarnessIssueGroup, type Issue, type UserBaseInfo } from '../services'
import { mutedText, pageBand, panel } from '../utils/themeClasses'

const defaultHarnessGroups: HarnessIssueGroup[] = []

// Page: 需求页
export function DemandBoardPage() {
  const { isDark } = useAppTheme()
  const [groups, setGroups] = useState<HarnessIssueGroup[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [scope, setScope] = useState('全部需求')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [users, setUsers] = useState<UserBaseInfo[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [form] = Form.useForm<CreateIssueInput>()
  const currentUser = authService.getCurrentUser()
  const currentUserName = currentUser?.userName

  const loadIssues = useCallback(async () => {
    setLoading(true)

    try {
      const nextGroups = await issueService.listMyHarness()
      setGroups(nextGroups ?? defaultHarnessGroups)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '需求数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadIssues()
  }, [loadIssues, reloadKey])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)

    try {
      setUsers(await userService.listAll())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '用户列表加载失败')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    const openCreateDialog = () => {
      setIsCreateOpen(true)
      void loadUsers()
    }

    window.addEventListener(CREATE_DEMAND_EVENT, openCreateDialog)
    return () => window.removeEventListener(CREATE_DEMAND_EVENT, openCreateDialog)
  }, [loadUsers])

  const visibleGroups = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const nextGroups = groups.map((group) => ({
      ...group,
      issues: group.issues.filter((issue) => {
        const matchesKeyword = !normalizedKeyword || issue.issueName.toLowerCase().includes(normalizedKeyword)
        const matchesScope =
          scope === '我的负责'
            ? issue.assignedUser === currentUserName
            : scope === '我跟进的'
              ? issue.stakeholders?.includes(currentUserName ?? '')
              : true

        return matchesKeyword && matchesScope
      }),
    }))

    return nextGroups.filter((group) => group.issues.length > 0)
  }, [currentUserName, groups, keyword, scope])

  const visibleIssueCount = useMemo(
    () => visibleGroups.reduce((total, group) => total + group.issues.length, 0),
    [visibleGroups],
  )

  async function handleCreateIssue(values: CreateIssueInput) {
    setIsCreating(true)

    try {
      await issueService.create({
        ...values,
        stakeholders: values.stakeholders ?? [],
        isHarness: true,
      })
      form.resetFields()
      setIsCreateOpen(false)
      setReloadKey((value) => value + 1)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr]">
      <DemandBoardToolbar
        isDark={isDark}
        keyword={keyword}
        scope={scope}
        onKeywordChange={setKeyword}
        onScopeChange={setScope}
      />
      <DemandBoardContent
        error={error}
        groups={visibleGroups}
        isDark={isDark}
        issueCount={visibleIssueCount}
        loading={loading}
      />
      <CreateIssueDialog
        form={form}
        isCreating={isCreating}
        open={isCreateOpen}
        users={users}
        usersLoading={usersLoading}
        onCancel={() => setIsCreateOpen(false)}
        onCreate={handleCreateIssue}
      />
    </section>
  )
}

function DemandBoardToolbar({
  isDark,
  keyword,
  scope,
  onKeywordChange,
  onScopeChange,
}: {
  isDark: boolean
  keyword: string
  scope: string
  onKeywordChange: (keyword: string) => void
  onScopeChange: (scope: string) => void
}) {
  return (
    <div className={`border-b p-4 ${pageBand(isDark)}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索需求名"
          value={keyword}
          className="h-10 w-full text-sm xl:w-[420px]"
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <Segmented
          value={scope}
          options={['全部需求', '我的负责', '我跟进的']}
          className="max-w-full overflow-auto"
          onChange={(value) => onScopeChange(String(value))}
        />
      </div>
    </div>
  )
}

function DemandBoardContent({
  error,
  groups,
  isDark,
  issueCount,
  loading,
}: {
  error: string | null
  groups: HarnessIssueGroup[]
  isDark: boolean
  issueCount: number
  loading: boolean
}) {
  return (
    <div className={`min-h-0 overflow-auto p-3 ${isDark ? 'bg-slate-950/60' : 'bg-slate-100'}`}>
      {loading ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border text-sm font-bold ${panel(isDark)}`}>
          正在加载需求数据...
        </div>
      ) : error ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border px-4 text-center text-sm font-bold ${panel(isDark)}`}>
          <span>需求数据加载失败：{error}</span>
        </div>
      ) : issueCount === 0 ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border px-4 text-center ${panel(isDark)}`}>
          <div>
            <div className="text-sm font-extrabold">暂无需求</div>
            <p className={`mt-2 text-xs ${mutedText(isDark)}`}>当前没有可展示的 DevOps 需求。</p>
          </div>
        </div>
      ) : (
        <IssueLaneGrid groups={groups} isDark={isDark} />
      )}
    </div>
  )
}

function IssueLaneGrid({ groups, isDark }: { groups: HarnessIssueGroup[]; isDark: boolean }) {
  return (
    <div className="grid min-w-[1440px] grid-cols-10 gap-3">
      {groups.map((group) => (
        <section
          key={group.harnessStatus}
          className={`grid min-h-[640px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          }`}
        >
          <header className={`flex min-h-14 items-center justify-between gap-2 border-b px-3 ${pageBand(isDark)}`}>
            <h2 className="text-sm font-extrabold">{group.harnessStatusDesc || issueService.harnessStatusTitles[group.harnessStatus]}</h2>
            <Badge count={group.issues.length} color="#4f46e5" />
          </header>
          <div className="min-h-0 overflow-auto p-2">
            {group.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} isDark={isDark} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function IssueCard({ issue, isDark }: { issue: Issue; isDark: boolean }) {
  return (
    <Link
      to={`/demands/${issue.id}`}
      className={`mb-2 block w-full rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${panel(isDark)}`}
    >
      <div className="text-sm font-extrabold leading-snug">{issue.issueName}</div>
      <p className={`mt-2 line-clamp-3 text-xs leading-relaxed ${mutedText(isDark)}`}>
        {issue.remark || issue.prd || issue.requireDetailUrl || '暂无需求详情'}
      </p>
      <div className={`mt-3 flex flex-wrap gap-2 text-[11px] font-bold ${mutedText(isDark)}`}>
        <span>{issue.harnessStatusDesc}</span>
        <span>{issue.assignedUserName || issue.assignedUser || '未指派'}</span>
      </div>
    </Link>
  )
}

function CreateIssueDialog({
  form,
  isCreating,
  open,
  users,
  usersLoading,
  onCancel,
  onCreate,
}: {
  form: ReturnType<typeof Form.useForm<CreateIssueInput>>[0]
  isCreating: boolean
  open: boolean
  users: UserBaseInfo[]
  usersLoading: boolean
  onCancel: () => void
  onCreate: (values: CreateIssueInput) => Promise<void>
}) {
  const userOptions = users.map((user) => ({
    label: getUserLabel(user),
    value: user.userName,
  }))

  return (
    <Modal
      title="创建需求"
      open={open}
      okText="创建"
      cancelText="取消"
      confirmLoading={isCreating}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onCreate}>
        <Form.Item
          label="需求标题"
          name="issueName"
          rules={[{ required: true, message: '请输入需求标题' }]}
        >
          <Input placeholder="例如：客户反馈分析控制台" />
        </Form.Item>
        <Form.Item
          initialValue={1}
          label="需求类型"
          name="issueType"
          rules={[{ required: true, message: '请选择需求类型' }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '项目', value: 1 },
              { label: '日常迭代', value: 2 },
              { label: '缺陷', value: 3 },
              { label: '优化', value: 4 },
            ]}
          />
        </Form.Item>
        <Form.Item
          initialValue={1}
          label="需求来源"
          name="issueSource"
          rules={[{ required: true, message: '请选择需求来源' }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '产品', value: 1 },
              { label: '客户', value: 2 },
              { label: '测试', value: 3 },
              { label: '其他', value: 4 },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="负责人"
          name="assignedUser"
          rules={[{ required: true, message: '请选择负责人' }]}
        >
          <Select
            showSearch
            loading={usersLoading}
            optionFilterProp="label"
            options={userOptions}
            placeholder="选择负责人"
          />
        </Form.Item>
        <Form.Item label="干系人" name="stakeholders">
          <Select
            mode="multiple"
            showSearch
            loading={usersLoading}
            optionFilterProp="label"
            options={userOptions}
            placeholder="选择干系人"
          />
        </Form.Item>
        <Form.Item label="需求描述" name="remark">
          <Input.TextArea placeholder="简要说明目标、背景或范围" autoSize={{ minRows: 3, maxRows: 5 }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function getUserLabel(user: UserBaseInfo) {
  const displayName = user.nick || user.realName || user.displayName || user.userName
  return `${displayName} (${user.userName})`
}
