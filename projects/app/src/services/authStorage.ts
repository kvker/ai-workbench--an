import type { LoginUser } from './types'

export const AUTH_STORAGE_KEY = 'ai-workbench:login-user'

export function readCurrentUser(): LoginUser | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const user = JSON.parse(raw) as LoginUser
    return user.token ? user : null
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getStoredToken() {
  return readCurrentUser()?.token
}

export function writeCurrentUser(user: LoginUser) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
