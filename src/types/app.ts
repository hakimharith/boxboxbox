export interface HostSession {
  isHost: boolean
  eventId: string
}

export const HOST_STORAGE_KEY = 'bbx_host_session'

export function getHostSession(eventId: string): HostSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${HOST_STORAGE_KEY}_${eventId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setHostSession(eventId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${HOST_STORAGE_KEY}_${eventId}`, JSON.stringify({ isHost: true, eventId }))
}
