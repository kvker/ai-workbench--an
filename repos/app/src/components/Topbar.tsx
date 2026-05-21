import { Switch } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppTheme } from '../providers/themeContext'
import { authService } from '../services'
import { PrimaryButton } from './Button'

export const CREATE_DEMAND_EVENT = 'ai-workbench:create-demand'

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, setMode } = useAppTheme()
  const currentUser = authService.getCurrentUser()
  const isBoard = location.pathname === '/demands'
  const isDetail = location.pathname.startsWith('/demands/')
  const sectionName = isBoard ? '需求页' : '详情页'
  const title = isBoard ? 'AI Native 产研需求看板' : '需求详情'

  return (
    <header
      className={`grid min-h-16 grid-cols-[minmax(0,1fr)] items-center gap-3 border-b px-4 py-3 transition-colors lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:py-0 ${
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      }`}
    >
      <Link to="/demands" className="flex min-w-0 items-center gap-3 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-600 font-black text-white shadow-[0_8px_18px_rgba(79,70,229,0.22)]">
          H
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold">Harness Workbench</span>
          <span className="block truncate text-xs text-slate-400">{sectionName}</span>
        </span>
      </Link>

      <div className="min-w-0">
        {!isBoard && (
          <div className="truncate text-xs text-slate-400">
            DevOps Issue
          </div>
        )}
        <h1 className="truncate text-lg font-extrabold leading-tight lg:text-xl">{title}</h1>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        {currentUser && (
          <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentUser.displayName || currentUser.realName || currentUser.userName}
          </span>
        )}
        <div className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>暗色</span>
          <Switch
            checked={isDark}
            size="small"
            onChange={(checked) => setMode(checked ? 'dark' : 'light')}
            aria-label="切换暗黑风格"
          />
        </div>
        {isBoard && <PrimaryButton onClick={() => window.dispatchEvent(new Event(CREATE_DEMAND_EVENT))}>创建需求</PrimaryButton>}
        {isDetail && null}
        <PrimaryButton
          onClick={() => {
            authService.clearCurrentUser()
            navigate('/login', { replace: true })
          }}
        >
          退出
        </PrimaryButton>
      </nav>
    </header>
  )
}
