import { request } from './http'
import { clearStoredUser, getStoredToken, readCurrentUser, writeCurrentUser } from './authStorage'
import type { LoginInput, LoginUser } from './types'

const DEVOPS_API_BASE_URL = import.meta.env.VITE_DEVOPS_API_BASE_URL ?? 'http://devops-api.dahuangf.com:8090/devops'

export function getCurrentUser(): LoginUser | null {
  return readCurrentUser()
}

export function getToken() {
  return getStoredToken()
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function clearCurrentUser() {
  clearStoredUser()
}

export async function login(input: LoginInput) {
  const user = await request<LoginUser>('/user/login', {
    baseUrl: DEVOPS_API_BASE_URL,
    body: input,
    method: 'POST',
  })

  writeCurrentUser(user)
  return user
}
