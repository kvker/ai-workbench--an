import { Pill } from '../../components/Pill'

export function PanelHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-extrabold">{title}</h2>
      {typeof action === 'string' ? <Pill tone={action.includes('docs') ? 'cyan' : 'default'}>{action}</Pill> : action}
    </div>
  )
}
