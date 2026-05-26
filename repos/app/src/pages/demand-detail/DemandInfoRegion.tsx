import { CloudSyncOutlined, EditOutlined, FileTextOutlined, FolderOpenOutlined, RocketOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { issueService, type Issue } from '../../services'
import { mutedText, panel } from '../../utils/themeClasses'

export function DemandInfoRegion({
  issue,
  isDark,
  isUpdatingFiles,
  loading,
  onEditIssue,
  onOpenDetail,
  onOpenDocumentRegion,
  onOpenDeployPlans,
  onUpdateFiles,
}: {
  issue: Issue
  isDark: boolean
  isUpdatingFiles: boolean
  loading: boolean
  onEditIssue: () => void
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onOpenDeployPlans: () => void
  onUpdateFiles: () => void
}) {
  const tagText = formatIssueTags(issue)

  return (
    <section className={`rounded-lg border p-3 ${panel(isDark)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="break-words text-base font-extrabold leading-snug">{loading ? '正在加载...' : issue.issueName}</div>
            <Button
              aria-label="编辑需求"
              disabled={loading || !issue.id}
              icon={<EditOutlined />}
              size="small"
              type="text"
              onClick={onEditIssue}
            />
          </div>
          <div className={`mt-1 text-xs font-bold ${mutedText(isDark)}`}>
            标签: {tagText}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="small" icon={<FolderOpenOutlined />} onClick={onOpenDocumentRegion} className="text-xs font-extrabold">
            打开文档区
          </Button>
          <Button size="small" icon={<CloudSyncOutlined />} loading={isUpdatingFiles} onClick={onUpdateFiles} className="text-xs font-extrabold">
            更新物料
          </Button>
          <Button size="small" icon={<RocketOutlined />} onClick={onOpenDeployPlans} className="text-xs font-extrabold">
            发布计划
          </Button>
          <Button type="primary" size="small" onClick={onOpenDetail} className="text-xs font-extrabold">
            <FileTextOutlined />
            查看详情
          </Button>
        </div>
      </div>
    </section>
  )
}

function formatIssueTags(issue: Issue) {
  if (!issue.tags || issue.tags.length === 0) {
    return '无'
  }

  const tagLabelByValue = new Map(issueService.issueTagOptions.map((option) => [option.value, option.label]))
  return issue.tags.map((tag) => tagLabelByValue.get(tag) ?? tag).join(',')
}
