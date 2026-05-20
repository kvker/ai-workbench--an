import type { ReactNode } from 'react'
import { Tag } from 'antd'
import type { Tone } from '../services'
import { useAppTheme } from '../providers/themeContext'
import { toneClass } from '../utils/toneClasses'

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  const { isDark } = useAppTheme()

  return (
    <Tag className={`m-0 inline-flex min-h-5 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass(tone, isDark)}`}>
      {children}
    </Tag>
  )
}
