import type { Tone } from '../services'

const lightToneClasses: Record<Tone, string> = {
  default: 'border-slate-200 bg-slate-50 text-slate-600',
  cyan: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
}

const darkToneClasses: Record<Tone, string> = {
  default: 'border-slate-700 bg-slate-800/80 text-slate-300',
  cyan: 'border-indigo-400/35 bg-indigo-500/15 text-indigo-100',
  green: 'border-emerald-300/30 bg-emerald-900/30 text-emerald-100',
  amber: 'border-amber-300/30 bg-amber-900/30 text-amber-100',
  red: 'border-rose-300/30 bg-rose-900/30 text-rose-100',
  blue: 'border-blue-300/35 bg-blue-900/35 text-blue-100',
}

export function toneClass(tone: Tone, isDark: boolean) {
  return isDark ? darkToneClasses[tone] : lightToneClasses[tone]
}
