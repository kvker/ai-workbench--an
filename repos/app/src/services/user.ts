import { request } from './http'
import type { UserBaseInfo } from './types'

const DEVOPS_API_BASE_URL = import.meta.env.VITE_DEVOPS_API_BASE_URL ?? 'http://devops-api.dahuangf.com:8090/devops'

export async function listAll() {
  return request<UserBaseInfo[]>('/user/listAll', {
    baseUrl: DEVOPS_API_BASE_URL,
  })
}
