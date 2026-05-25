import { useEffect } from 'react'
import { Form, Input, Modal, Radio, Select } from 'antd'
import { issueService, type Issue, type UpdateIssueInput, type UserBaseInfo } from '../../services'

export function EditIssueDialog({
  issue,
  isSaving,
  open,
  users,
  usersLoading,
  onCancel,
  onSave,
}: {
  issue: Issue
  isSaving: boolean
  open: boolean
  users: UserBaseInfo[]
  usersLoading: boolean
  onCancel: () => void
  onSave: (values: UpdateIssueInput) => Promise<void>
}) {
  const [form] = Form.useForm<UpdateIssueInput>()
  const userOptions = users.map((user) => ({
    label: getUserLabel(user),
    value: user.userName,
  }))

  useEffect(() => {
    if (!open) return

    form.setFieldsValue({
      id: issue.id,
      issueName: issue.issueName,
      issueType: issue.issueType,
      issueSource: issue.issueSource,
      requireDetailUrl: issue.requireDetailUrl,
      assignedUser: issue.assignedUser,
      stakeholders: issue.stakeholders ?? [],
      tags: issue.tags ?? [],
      isHarness: issue.isHarness,
      remark: issue.remark,
    })
  }, [form, issue, open])

  return (
    <Modal
      title="编辑需求"
      open={open}
      okText="保存"
      cancelText="取消"
      confirmLoading={isSaving}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          label="需求标题"
          name="issueName"
          rules={[{ required: true, message: '请输入需求标题' }]}
        >
          <Input placeholder="例如：客户反馈分析控制台" />
        </Form.Item>
        <Form.Item
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
        <Form.Item label="标签" name="tags">
          <Select mode="multiple" options={issueService.issueTagOptions} placeholder="选择标签" />
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
