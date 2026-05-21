export function pageBand(isDark: boolean) {
  return isDark ? 'border-slate-800 bg-slate-950/55 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-950'
}

export function panel(isDark: boolean) {
  return isDark ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-slate-200 bg-white text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
}

export function panelSoft(isDark: boolean) {
  return isDark ? 'border-slate-800 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-slate-50/80 text-slate-950'
}

export function mutedText(isDark: boolean) {
  return isDark ? 'text-slate-400' : 'text-slate-500'
}

export function dividerBorder(isDark: boolean) {
  return isDark ? 'border-slate-800' : 'border-slate-200'
}
