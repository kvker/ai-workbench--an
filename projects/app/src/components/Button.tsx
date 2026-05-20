import type { ReactNode } from 'react'
import { Button } from 'antd'
import { NavLink } from 'react-router-dom'
import { useAppTheme } from '../providers/themeContext'
import { toneClass } from '../utils/toneClasses'

export function PrimaryButton({
  children,
  onClick,
  to,
  href,
  target,
}: {
  children: ReactNode
  onClick?: () => void
  to?: string
  href?: string
  target?: string
}) {
  const className = 'text-xs font-extrabold'

  if (href) {
    return (
      <Button type="primary" href={href} target={target} rel={target === '_blank' ? 'noreferrer' : undefined} className={className}>
        {children}
      </Button>
    )
  }

  if (to) {
    return (
      <NavLink to={to}>
        <Button type="primary" className={className}>
          {children}
        </Button>
      </NavLink>
    )
  }

  return (
    <Button type="primary" onClick={onClick} className={className}>
      {children}
    </Button>
  )
}

export function NavButton({ children, to }: { children: ReactNode; to: string }) {
  const { isDark } = useAppTheme()

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Button className={`text-xs font-extrabold ${isActive ? toneClass('cyan', isDark) : isDark ? 'border-slate-700 bg-slate-900/80 text-slate-300' : ''}`}>
          {children}
        </Button>
      )}
    </NavLink>
  )
}

export function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center text-xs font-extrabold"
    >
      {children}
    </Button>
  )
}
