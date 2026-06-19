'use server'
import { db } from '@/lib/db'

export async function joinEvent(
  code: string
): Promise<{ error: string } | { success: true; eventId: string }> {
  const normalized = code.trim()
  const rows = await db<{ id: string }[]>`
    SELECT id FROM boxboxbox.events WHERE access_code = ${normalized} LIMIT 1
  `
  if (rows.length === 0) return { error: 'Invalid access code. Please check and try again.' }
  return { success: true, eventId: rows[0].id }
}
