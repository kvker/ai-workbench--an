import { Modal } from 'antd'
import { issueService, type Issue } from '../../services'
import { useAppTheme } from '../../providers/themeContext'
import { mutedText, panel } from '../../utils/themeClasses'
import { getIssueFlowTitle } from './demandDetailData'

export function DetailDialog({
  issue,
  workspacePath,
  branch,
  open,
  onClose,
}: {
  issue: Issue
  workspacePath?: string
  branch: string
  open: boolean
  onClose: () => void
}) {
  const { isDark } = useAppTheme()
  const rows = [
    ['需求名', issue.issueName],
    ['当前状态', issue.issueStatusDesc || issueService.issueStatusTitles[issue.status]],
    ['流程状态', getIssueFlowTitle(issue)],
    ['需求类型', issue.issueTypeDesc],
    ['需求来源', issue.issueSourceDesc],
    ['负责人', issue.assignedUserName || issue.assignedUser],
    ['创建人', issue.createdUserName || issue.createdUser],
    ['工作区分支', branch],
    ['本机路径', workspacePath || '未创建工作区'],
    ['创建时间', issue.createdAt],
    ['详情链接', issue.requireDetailUrl],
  ]

  return (
    <Modal title="需求详情" open={open} onCancel={onClose} footer={null} width={760}>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className={`rounded-lg border p-3 ${panel(isDark)}`}>
            <div className={`text-xs ${mutedText(isDark)}`}>{label}</div>
            <div className="mt-1 break-words text-sm font-extrabold leading-relaxed">{value || '-'}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
