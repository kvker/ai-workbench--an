import type { Tone } from '../services'

export const toneClasses: Record<Tone, string> = {
  default: 'border-slate-600/80 bg-slate-900/80 text-slate-300',
  cyan: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
  green: 'border-emerald-300/30 bg-emerald-900/30 text-emerald-100',
  amber: 'border-amber-300/30 bg-amber-900/30 text-amber-100',
  red: 'border-red-300/30 bg-red-900/30 text-red-100',
  blue: 'border-blue-300/35 bg-blue-900/35 text-blue-100',
}
