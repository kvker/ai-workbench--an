import { CloudSyncOutlined, FileTextOutlined, FolderOpenOutlined, RocketOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { Issue } from '../../services'
import { mutedText, panel } from '../../utils/themeClasses'
import { getIssueFlowTitle } from './demandDetailData'

export function DemandInfoRegion({
  issue,
  isDark,
  isUpdatingFiles,
  loading,
  onOpenDetail,
  onOpenDocumentRegion,
  onOpenDeployPlans,
  onUpdateFiles,
}: {
  issue: Issue
  isDark: boolean
  isUpdatingFiles: boolean
  loading: boolean
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onOpenDeployPlans: () => void
  onUpdateFiles: () => void
}) {
  return (
    <section className={`rounded-lg border p-3 ${panel(isDark)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-base font-extrabold leading-snug">{loading ? '正在加载...' : issue.issueName}</div>
          <div className={`mt-1 text-xs font-bold ${mutedText(isDark)}`}>
            {getIssueFlowTitle(issue)} / {issue.assignedUserName || issue.assignedUser || '未指派'}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="small" icon={<FolderOpenOutlined />} onClick={onOpenDocumentRegion} className="text-xs font-extrabold">
            打开文档区
          </Button>
          <Button size="small" icon={<CloudSyncOutlined />} loading={isUpdatingFiles} onClick={onUpdateFiles} className="text-xs font-extrabold">
            更新文件
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
