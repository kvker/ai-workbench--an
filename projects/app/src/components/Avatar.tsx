export function Avatar({ label, ai = false }: { label: string; ai?: boolean }) {
  return (
    <div
      className={`grid size-8 place-items-center rounded-lg text-xs font-black text-slate-950 ${
        ai ? 'bg-gradient-to-br from-cyan-300 to-blue-300' : 'bg-blue-300'
      }`}
    >
      {label}
    </div>
  )
}
