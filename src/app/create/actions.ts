'use server'
import { db } from '@/lib/db'
import { customAlphabet } from 'nanoid'
import { Event } from '@/types/database'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 7)

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const raw = nanoid()
    const code = raw.slice(0, 3) + '-' + raw.slice(3)
    const rows = await db`SELECT id FROM boxboxbox.events WHERE access_code = ${code} LIMIT 1`
    if (rows.length === 0) return code
  }
  throw new Error('Could not generate unique access code')
}

export async function createEvent(formData: {
  name: string
  location: string
  raceDate: string
  startTime: string
  totalDurationHours: number
  totalDurationMinutes: number
  numDrivers: number
  totalSwapsTarget: number | null
  maxStintTimeMinutes: number | null
  drivers: Array<{ name: string; sequenceOrder: number }>
}): Promise<{ error: string } | { success: true; eventId: string; accessCode: string }> {
  const code = await generateUniqueCode()

  const startDateTime =
    formData.raceDate && formData.startTime
      ? new Date(`${formData.raceDate}T${formData.startTime}:00`).toISOString()
      : null

  if (startDateTime) {
    const startMs = new Date(startDateTime).getTime()
    if (Date.now() - startMs > 24 * 60 * 60 * 1000) {
      return { error: 'Start time cannot be more than 24 hours ago' }
    }
  }

  const totalDurationMinutes = formData.totalDurationHours * 60 + formData.totalDurationMinutes

  try {
    const [event] = await db<Event[]>`
      INSERT INTO boxboxbox.events (
        name, location, race_date, start_time, total_duration_minutes,
        num_drivers, total_swaps_target, max_stint_time_minutes, access_code, status
      ) VALUES (
        ${formData.name},
        ${formData.location || null},
        ${formData.raceDate || null},
        ${startDateTime},
        ${totalDurationMinutes},
        ${formData.numDrivers},
        ${formData.totalSwapsTarget ?? null},
        ${formData.maxStintTimeMinutes ?? null},
        ${code},
        'pending'
      ) RETURNING *
    `

    for (const d of formData.drivers) {
      await db`
        INSERT INTO boxboxbox.drivers (event_id, name, sequence_order)
        VALUES (${event.id}, ${d.name}, ${d.sequenceOrder})
      `
    }

    return { success: true, eventId: event.id, accessCode: code }
  } catch (err) {
    console.error(err)
    return { error: 'Failed to create event' }
  }
}
