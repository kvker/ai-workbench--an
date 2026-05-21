import type { DemandIdentity } from '../../services/task'

export const demandIdentityOptions: Array<{ label: string; value: DemandIdentity }> = [
  { label: '产品', value: 'pm' },
  { label: '前端', value: 'fe' },
  { label: '后端', value: 'be' },
  { label: '测试', value: 'qa' },
]

export function getDemandIdentityLabel(identity: DemandIdentity) {
  return demandIdentityOptions.find((option) => option.value === identity)?.label ?? '产品'
}

export function getDemandIdentityStorageKey(demandId: string) {
  return `ai-workbench:demand-identity:${demandId || 'unknown'}`
}

export function readStoredDemandIdentity(storageKey: string): DemandIdentity {
  const storedValue = window.localStorage.getItem(storageKey)

  return isDemandIdentity(storedValue) ? storedValue : 'pm'
}

function isDemandIdentity(value: string | null): value is DemandIdentity {
  return demandIdentityOptions.some((option) => option.value === value)
}
