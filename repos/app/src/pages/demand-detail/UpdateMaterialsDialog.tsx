import { AppstoreOutlined, CheckOutlined, CloudSyncOutlined, TeamOutlined } from '@ant-design/icons'
import { Checkbox, Collapse, Empty, Modal, Steps, Tag } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { KnowledgeMaterialCategory, KnowledgeMaterialGroup, KnowledgeMaterialSelection, KnowledgeRole } from '../../services/task'

const roleOptions: Array<{ label: string; value: KnowledgeRole }> = [
  { label: 'PM', value: 'pm' },
  { label: 'FE', value: 'fe' },
  { label: 'BE', value: 'be' },
  { label: 'QA', value: 'qa' },
]

const categoryLabels: Record<KnowledgeMaterialCategory, string> = {
  conventions: 'Conventions',
  agents: 'Agents',
  skills: 'Skills',
}

const roleLabels: Record<KnowledgeRole, string> = {
  pm: 'PM',
  fe: 'FE',
  be: 'BE',
  qa: 'QA',
}

const steps = [
  { title: '选择角色', icon: <TeamOutlined /> },
  { title: '选择物料', icon: <AppstoreOutlined /> },
]

export function UpdateMaterialsDialog({
  groups,
  loading,
  open,
  roles,
  selection,
  submitting,
  onClose,
  onRolesChange,
  onSelectionChange,
  onSubmit,
}: {
  groups: KnowledgeMaterialGroup[]
  loading: boolean
  open: boolean
  roles: KnowledgeRole[]
  selection: KnowledgeMaterialSelection
  submitting: boolean
  onClose: () => void
  onRolesChange: (roles: KnowledgeRole[]) => void
  onSelectionChange: (selection: KnowledgeMaterialSelection) => void
  onSubmit: () => void
}) {
  const selectedCount = Object.values(selection).reduce((total, items) => total + items.length, 0)

  return (
    <Modal
      title="更新物料"
      open={open}
      width={760}
      okText="更新物料"
      cancelText="取消"
      confirmLoading={submitting}
      okButtonProps={{ disabled: loading || roles.length === 0 || selectedCount === 0, icon: <CloudSyncOutlined /> }}
      onCancel={onClose}
      onOk={onSubmit}
    >
      <div className="space-y-5">
        <Steps current={roles.length > 0 ? 1 : 0} size="small" items={steps} />

        <section className="space-y-2">
          <div className="text-sm font-extrabold">角色</div>
          <Checkbox.Group
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            options={roleOptions}
            value={roles}
            onChange={(values) => onRolesChange(values as KnowledgeRole[])}
          />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">物料</div>
            <Tag icon={<CheckOutlined />} color={selectedCount > 0 ? 'blue' : 'default'}>
              已选 {selectedCount}
            </Tag>
          </div>

          {groups.length > 0 ? (
            <Collapse
              defaultActiveKey={groups.map((group) => group.category)}
              items={groups.map((group) => createGroupPanel(group, selection, onSelectionChange))}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '正在加载物料...' : '请先选择角色'} />
          )}
        </section>
      </div>
    </Modal>
  )
}

function createGroupPanel(
  group: KnowledgeMaterialGroup,
  selection: KnowledgeMaterialSelection,
  onSelectionChange: (selection: KnowledgeMaterialSelection) => void,
) {
  const selectedIds = selection[group.category] ?? []
  const groupIds = group.items.map((item) => item.id)
  const allChecked = groupIds.length > 0 && groupIds.every((id) => selectedIds.includes(id))
  const someChecked = groupIds.some((id) => selectedIds.includes(id))

  return {
    key: group.category,
    label: (
      <div className="flex flex-wrap items-center gap-2">
        <span>{categoryLabels[group.category]}</span>
        <Tag>{selectedIds.length}/{groupIds.length}</Tag>
      </div>
    ),
    extra: (
      <Checkbox
        checked={allChecked}
        indeterminate={!allChecked && someChecked}
        onChange={(event) => {
          event.stopPropagation()
          onSelectionChange({
            ...selection,
            [group.category]: event.target.checked ? groupIds : [],
          })
        }}
        onClick={(event) => event.stopPropagation()}
      >
        全选
      </Checkbox>
    ),
    children: (
      <div className="grid gap-2 sm:grid-cols-2">
        {group.items.map((item) => (
          <Checkbox
            key={item.id}
            checked={selectedIds.includes(item.id)}
            onChange={(event) => toggleMaterial(event, group.category, item.id, selection, onSelectionChange)}
          >
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="font-semibold">{formatMaterialName(item.id)}</span>
              {item.role ? <Tag color="processing">{roleLabels[item.role]}</Tag> : <Tag>兼容</Tag>}
              <span className="text-xs text-slate-500">{item.sourceDirs.join(' / ')}</span>
            </span>
          </Checkbox>
        ))}
      </div>
    ),
  }
}

function toggleMaterial(
  event: CheckboxChangeEvent,
  category: KnowledgeMaterialCategory,
  materialId: string,
  selection: KnowledgeMaterialSelection,
  onSelectionChange: (selection: KnowledgeMaterialSelection) => void,
) {
  const selectedIds = selection[category] ?? []
  const nextIds = event.target.checked
    ? [...new Set([...selectedIds, materialId])]
    : selectedIds.filter((id) => id !== materialId)

  onSelectionChange({
    ...selection,
    [category]: nextIds,
  })
}

function formatMaterialName(id: string) {
  return id
    .split('/')
    .map((part) => part.toUpperCase())
    .join(' / ')
}
