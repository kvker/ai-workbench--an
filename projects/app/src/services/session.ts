import { readCurrentUser } from './authStorage'

export const mockSession = {
  userName: 'zweizhao',
  displayName: 'Zweizhao',
}

export function getWorkspaceUserKey() {
  const currentUser = readCurrentUser()

  return currentUser?.userName
    || currentUser?.realName
    || currentUser?.displayName
    || (currentUser?.userId ? String(currentUser.userId) : undefined)
    || mockSession.userName
}

export function getWorkspaceDisplayName() {
  const currentUser = readCurrentUser()

  return currentUser?.displayName || currentUser?.realName || currentUser?.userName || mockSession.displayName
}
