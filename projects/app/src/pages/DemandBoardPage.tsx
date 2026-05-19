import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Badge, Modal, Radio, Segmented } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CREATE_DEMAND_EVENT } from '../components/Topbar'
import { useAppTheme } from '../providers/themeContext'
import { mockData } from '../services/mockData'
import { useAsyncData } from '../services/useAsyncData'
import { workspaceService, type CreateDemandInput, type Demand, type Lane } from '../services'
import { mutedText, pageBand, panel } from '../utils/themeClasses'

// Page: 需求页
export function DemandBoardPage() {
  const { isDark } = useAppTheme()
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form] = Form.useForm<CreateDemandInput>()
  const loadWorkspace = useCallback(() => workspaceService.getWorkspace(), [])
  const { data: workspace, error, loading } = useAsyncData(mockData.workspace, loadWorkspace, reloadKey)
  const { lanes } = workspace
  const demandCount = lanes.reduce((total, lane) => total + lane.demands.length, 0)

  useEffect(() => {
    const openCreateDialog = () => setIsCreateOpen(true)

    window.addEventListener(CREATE_DEMAND_EVENT, openCreateDialog)
    return () => window.removeEventListener(CREATE_DEMAND_EVENT, openCreateDialog)
  }, [])

  async function handleCreateDemand(values: CreateDemandInput) {
    setIsCreating(true)

    try {
      await workspaceService.createDemand(values)
      form.resetFields()
      setIsCreateOpen(false)
      setReloadKey((value) => value + 1)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr]">
      <DemandBoardToolbar isDark={isDark} />
      <DemandBoardContent
        demandCount={demandCount}
        error={error}
        isDark={isDark}
        lanes={lanes}
        loading={loading}
      />
      <CreateDemandDialog
        form={form}
        isCreating={isCreating}
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onCreate={handleCreateDemand}
      />
    </section>
  )
}

function DemandBoardToolbar({ isDark }: { isDark: boolean }) {
  return (
    <div className={`border-b p-4 ${pageBand(isDark)}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索需求名、负责人、来源或工程分支"
          className="h-10 w-full text-sm xl:w-[420px]"
        />
        <Segmented
          defaultValue="全部需求"
          options={['全部需求', '我的负责', '我跟进的']}
          className="max-w-full overflow-auto"
        />
      </div>
    </div>
  )
}

function DemandBoardContent({
  demandCount,
  error,
  isDark,
  lanes,
  loading,
}: {
  demandCount: number
  error: string | null
  isDark: boolean
  lanes: Lane[]
  loading: boolean
}) {
  return (
    <div className={`min-h-0 overflow-auto p-3 ${isDark ? 'bg-slate-950/50' : 'bg-slate-100/70'}`}>
      {loading ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border text-sm font-bold ${panel(isDark)}`}>
          正在加载需求数据...
        </div>
      ) : error ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border px-4 text-center text-sm font-bold ${panel(isDark)}`}>
          <span>需求数据加载失败：{error}</span>
        </div>
      ) : demandCount === 0 ? (
        <div className={`grid min-h-[360px] place-items-center rounded-lg border px-4 text-center ${panel(isDark)}`}>
          <div>
            <div className="text-sm font-extrabold">暂无需求</div>
            <p className={`mt-2 text-xs ${mutedText(isDark)}`}>点击右上角创建需求，开始原型流程。</p>
          </div>
        </div>
      ) : (
        <DemandLaneGrid isDark={isDark} lanes={lanes} />
      )}
    </div>
  )
}

function DemandLaneGrid({ isDark, lanes }: { isDark: boolean; lanes: Lane[] }) {
  return (
    <div className="grid min-w-[1180px] grid-cols-6 gap-3">
      {lanes.map((lane) => (
        <section
          key={lane.title}
          className={`grid min-h-[640px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border ${
            isDark ? 'border-slate-700/80 bg-slate-900/70' : 'border-slate-200 bg-white/80'
          }`}
        >
          <header className={`flex min-h-14 items-center justify-between gap-2 border-b px-3 ${pageBand(isDark)}`}>
            <h2 className="text-sm font-extrabold">{lane.title}</h2>
            <Badge count={lane.demands.length} color="#22d3ee" />
          </header>
          <div className="min-h-0 overflow-auto p-2">
            {lane.demands.map((demand) => (
              <DemandCard key={demand.id} demand={demand} isDark={isDark} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DemandCard({ demand, isDark }: { demand: Demand; isDark: boolean }) {
  return (
    <Link
      to={`/demands/${demand.id}`}
      className={`mb-2 block w-full rounded-lg border p-3 text-left transition hover:border-cyan-300/70 ${panel(isDark)}`}
    >
      <div className="text-sm font-extrabold leading-snug">{demand.title}</div>
      <p className={`mt-2 text-xs leading-relaxed ${mutedText(isDark)}`}>{demand.description}</p>
    </Link>
  )
}

function CreateDemandDialog({
  form,
  isCreating,
  open,
  onCancel,
  onCreate,
}: {
  form: ReturnType<typeof Form.useForm<CreateDemandInput>>[0]
  isCreating: boolean
  open: boolean
  onCancel: () => void
  onCreate: (values: CreateDemandInput) => Promise<void>
}) {
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
          name="title"
          rules={[{ required: true, message: '请输入需求标题' }]}
        >
          <Input placeholder="例如：客户反馈分析控制台" />
        </Form.Item>
        <Form.Item
          label="需求描述"
          name="description"
          rules={[{ required: true, message: '请输入需求描述' }]}
        >
          <Input.TextArea placeholder="简要说明目标、背景或范围" autoSize={{ minRows: 3, maxRows: 5 }} />
        </Form.Item>
        <Form.Item
          initialValue="业务方"
          label="需求来源"
          name="source"
          rules={[{ required: true, message: '请选择需求来源' }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={['业务方', '产品方']}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
