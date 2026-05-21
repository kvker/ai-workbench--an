export function Avatar({ label, ai = false }: { label: string; ai?: boolean }) {
  return (
    <div
      className={`grid size-8 place-items-center rounded-lg text-xs font-black ${
        ai ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {label}
    </div>
  )
}
