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
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-100 text-slate-950'
      }`}
    >
      <section
        className={`mx-auto grid h-[calc(100vh-24px)] max-w-[1600px] grid-rows-[auto_1fr] overflow-hidden rounded-xl border shadow-[0_18px_60px_rgba(15,23,42,0.12)] transition-colors sm:h-[calc(100vh-32px)] ${
          isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
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
