import { readCurrentUser } from './authStorage'

export const mockSession = {
  userId: 'user-zweizhao',
  displayName: 'Zweizhao',
}

export function getWorkspaceUserId() {
  const currentUser = readCurrentUser()

  return currentUser?.userId ? String(currentUser.userId) : mockSession.userId
}

export function getWorkspaceDisplayName() {
  const currentUser = readCurrentUser()

  return currentUser?.displayName || currentUser?.realName || currentUser?.userName || mockSession.displayName
}
