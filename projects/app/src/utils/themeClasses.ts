export function pageBand(isDark: boolean) {
  return isDark ? 'border-slate-700/80 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
}

export function panel(isDark: boolean) {
  return isDark ? 'border-slate-700/80 bg-slate-900/80' : 'border-slate-200 bg-white'
}

export function panelSoft(isDark: boolean) {
  return isDark ? 'border-slate-700/80 bg-slate-900/60' : 'border-slate-200 bg-white/70'
}

export function mutedText(isDark: boolean) {
  return isDark ? 'text-slate-400' : 'text-slate-500'
}

export function dividerBorder(isDark: boolean) {
  return isDark ? 'border-slate-700/80' : 'border-slate-200'
}
