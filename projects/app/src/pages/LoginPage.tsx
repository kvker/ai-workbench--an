import { useState, type FormEvent } from 'react'
import { Alert, Button, Checkbox, Input } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppTheme } from '../providers/themeContext'
import { authService, type AuthType } from '../services'

type LocationState = {
  from?: {
    pathname?: string
  }
}

// Page: 登录页
export function LoginPage() {
  const { isDark } = useAppTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [useLdap, setUseLdap] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/demands'

  if (authService.isLoggedIn()) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await authService.login({
        authType: (useLdap ? 1 : 0) as AuthType,
        password,
        username,
      })
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={`grid min-h-screen place-items-center p-4 ${
        isDark
          ? 'bg-[#050816] text-slate-100'
          : 'bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#eff6ff_100%)] text-slate-950'
      }`}
    >
      <div
        className={`grid w-full max-w-[980px] overflow-hidden rounded-2xl border shadow-[0_28px_90px_rgba(15,23,42,0.18)] lg:grid-cols-[1fr_420px] ${
          isDark ? 'border-slate-400/20 bg-[#070c1a]' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`hidden min-h-[560px] p-10 lg:grid lg:grid-rows-[auto_1fr_auto] ${
            isDark ? 'bg-slate-950' : 'bg-slate-950 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-cyan-300 text-lg font-black text-slate-950">
              H
            </span>
            <span>
              <span className="block text-sm font-extrabold">Harness Workbench</span>
              <span className="block text-xs text-slate-400">AI Native 产研工作台</span>
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-cyan-200">登录后进入需求看板</p>
            <h1 className="mt-4 max-w-[520px] text-4xl font-black leading-tight">
              让需求、代码和交付过程回到同一个工作台。
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
            {['需求识别', '执行空间', '代码入口'].map((item) => (
              <span key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-bold">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className={`p-6 sm:p-8 ${isDark ? 'bg-slate-900/90' : 'bg-white'}`}>
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-cyan-300 text-lg font-black text-slate-950">
                H
              </span>
              <span>
                <span className="block text-sm font-extrabold">Harness Workbench</span>
                <span className="block text-xs text-slate-400">AI Native 产研工作台</span>
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black">登录</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              使用 DevOps 账号进入工作台。
            </p>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold">
              账号
              <Input
                autoComplete="username"
                className="h-11"
                prefix={<UserOutlined />}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入账号"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              密码
              <Input.Password
                autoComplete="current-password"
                className="h-11"
                prefix={<LockOutlined />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                required
              />
            </label>

            <Checkbox checked={useLdap} onChange={(event) => setUseLdap(event.target.checked)}>
              是否使用 LDAP 登录
            </Checkbox>

            {error && <Alert type="error" message={error} showIcon />}

            <Button
              block
              className="h-11 font-extrabold"
              htmlType="submit"
              loading={isSubmitting}
              type="primary"
            >
              登录
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
