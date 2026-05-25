import { Modal } from 'antd'
import { getWorkspaceUserKey } from './session'
import { clearStoredUser, getStoredToken } from './authStorage'

export type HttpRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  baseUrl?: string
  headers?: Record<string, string>
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://172.16.4.81:3100/api'
let unauthorizedDialogOpen = false

type ApiResult<T> = {
  code?: string | number
  msg?: string
  message?: string
  data?: T
}

export async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const token = getStoredToken()
  const response = await fetch(`${options.baseUrl ?? API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-user': getWorkspaceUserKey(),
      ...(token ? { token } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    showUnauthorizedDialog()
    throw new Error('登录状态已失效')
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  return unwrapApiResult<T>(payload)
}

function unwrapApiResult<T>(payload: T | ApiResult<T>) {
  if (!payload || typeof payload !== 'object' || !('code' in payload)) {
    return payload as T
  }

  const result = payload as ApiResult<T>

  if (result.code === '0' || result.code === 0) {
    return result.data as T
  }

  throw new Error(result.msg ?? result.message ?? `Request failed: ${result.code}`)
}

function showUnauthorizedDialog() {
  clearStoredUser()

  if (unauthorizedDialogOpen) {
    return
  }

  unauthorizedDialogOpen = true
  Modal.warning({
    title: '登录状态已失效',
    content: '请重新登录后继续使用工作台。',
    okText: '去登录',
    centered: true,
    onOk: () => {
      unauthorizedDialogOpen = false
      window.location.assign('/login')
    },
    afterClose: () => {
      unauthorizedDialogOpen = false
    },
  })
}
