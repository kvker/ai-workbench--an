import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { Topbar } from './components/Topbar'
import { DemandBoardPage } from './pages/DemandBoardPage'
import { DemandDetailPage } from './pages/DemandDetailPage'
import { LoginPage } from './pages/LoginPage'
import { useAppTheme } from './providers/themeContext'
import { authService, workspaceService } from './services'

function App() {
  const { isDark } = useAppTheme()
  const activeDemandId = workspaceService.getActiveDemandId()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <WorkbenchShell activeDemandId={activeDemandId} isDark={isDark} />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()

  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function WorkbenchShell({ activeDemandId, isDark }: { activeDemandId: string; isDark: boolean }) {
  return (
    <main
      className={`min-h-screen p-3 transition-colors sm:p-4 ${
        isDark
          ? 'bg-[#050816] text-slate-100'
          : 'bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 text-slate-950'
      }`}
    >
      <section
        className={`mx-auto grid h-[calc(100vh-24px)] max-w-[1600px] grid-rows-[auto_1fr] overflow-hidden rounded-2xl border shadow-[0_28px_90px_rgba(0,0,0,0.18)] transition-colors sm:h-[calc(100vh-32px)] ${
          isDark ? 'border-slate-400/20 bg-[#070c1a]/95' : 'border-slate-200 bg-white/90'
        }`}
      >
        <Topbar />
        <Routes>
          <Route path="/" element={<Navigate to="/demands" replace />} />
          <Route path="/demands" element={<DemandBoardPage />} />
          <Route path="/demands/:demandId" element={<DemandDetailPage />} />
          <Route path="*" element={<Navigate to={`/demands/${activeDemandId}`} replace />} />
        </Routes>
      </section>
    </main>
  )
}

export default App
