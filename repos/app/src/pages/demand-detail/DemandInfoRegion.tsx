import { CloudSyncOutlined, FileTextOutlined, FolderOpenOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { Issue } from '../../services'
import type { DemandIdentity } from '../../services/task'
import { mutedText, panel } from '../../utils/themeClasses'
import { getIssueFlowTitle } from './demandDetailData'
import { getDemandIdentityLabel } from './demandDetailIdentity'

export function DemandInfoRegion({
  issue,
  isDark,
  isUpdatingCode,
  loading,
  currentIdentity,
  onOpenDetail,
  onOpenDocumentRegion,
  onOpenIdentity,
  onUpdateCode,
}: {
  issue: Issue
  isDark: boolean
  isUpdatingCode: boolean
  loading: boolean
  currentIdentity: DemandIdentity
  onOpenDetail: () => void
  onOpenDocumentRegion: () => void
  onOpenIdentity: () => void
  onUpdateCode: () => void
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
          <Button size="small" icon={<UserSwitchOutlined />} onClick={onOpenIdentity} className="text-xs font-extrabold">
            {getDemandIdentityLabel(currentIdentity)}
          </Button>
          <Button size="small" icon={<CloudSyncOutlined />} loading={isUpdatingCode} onClick={onUpdateCode} className="text-xs font-extrabold">
            更新代码
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
