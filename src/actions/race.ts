'use server'
import { db } from '@/lib/db'

export async function startRace(eventId: string): Promise<{ error?: string }> {
  const events = await db<{ start_time: string | null; status: string }[]>`
    SELECT start_time, status FROM boxboxbox.events WHERE id = ${eventId} LIMIT 1
  `
  if (events.length === 0) return { error: 'Event not found' }
  const event = events[0]

  const now = new Date()
  let startTime: Date

  if (!event.start_time) {
    startTime = now
  } else {
    const existing = new Date(event.start_time)
    if (existing > now) {
      startTime = now
    } else {
      const hoursAgo = (now.getTime() - existing.getTime()) / 1000 / 3600
      if (hoursAgo > 24) return { error: 'Start time cannot be more than 24 hours ago' }
      startTime = existing
    }
  }

  await db`
    UPDATE boxboxbox.events
    SET status = 'active', start_time = ${startTime.toISOString()}
    WHERE id = ${eventId}
  `

  const drivers = await db<{ id: string }[]>`
    SELECT id FROM boxboxbox.drivers WHERE event_id = ${eventId} ORDER BY sequence_order LIMIT 1
  `
  if (drivers.length === 0) return { error: 'No drivers found for this event' }

  const existingStints = await db`
    SELECT id FROM boxboxbox.stints WHERE event_id = ${eventId} LIMIT 1
  `
  if (existingStints.length > 0) return {}

  await db`
    INSERT INTO boxboxbox.stints (event_id, driver_id, started_at, swap_number)
    VALUES (${eventId}, ${drivers[0].id}, ${startTime.toISOString()}, 1)
  `

  return {}
}

export async function swapDriver(eventId: string): Promise<{ error?: string }> {
  const now = new Date().toISOString()

  const currentStints = await db<{ id: string; driver_id: string }[]>`
    SELECT id, driver_id FROM boxboxbox.stints
    WHERE event_id = ${eventId} AND ended_at IS NULL
    LIMIT 1
  `
  if (currentStints.length === 0) return { error: 'No active stint found' }
  const currentStint = currentStints[0]

  const currentDrivers = await db<{ sequence_order: number }[]>`
    SELECT sequence_order FROM boxboxbox.drivers WHERE id = ${currentStint.driver_id} LIMIT 1
  `
  if (currentDrivers.length === 0) return { error: 'Current driver not found' }
  const currentOrder = currentDrivers[0].sequence_order

  const [{ count }] = await db<{ count: string }[]>`
    SELECT COUNT(*)::text as count FROM boxboxbox.drivers WHERE event_id = ${eventId}
  `
  const totalDrivers = parseInt(count, 10)
  const nextOrder = (currentOrder % totalDrivers) + 1

  const nextDrivers = await db<{ id: string }[]>`
    SELECT id FROM boxboxbox.drivers
    WHERE event_id = ${eventId} AND sequence_order = ${nextOrder}
    LIMIT 1
  `
  if (nextDrivers.length === 0) return { error: 'Next driver not found' }

  await db`UPDATE boxboxbox.stints SET ended_at = ${now} WHERE id = ${currentStint.id}`

  const [{ count: stintCount }] = await db<{ count: string }[]>`
    SELECT COUNT(*)::text as count FROM boxboxbox.stints WHERE event_id = ${eventId}
  `
  const swapNumber = parseInt(stintCount, 10) + 1

  await db`
    INSERT INTO boxboxbox.stints (event_id, driver_id, started_at, swap_number)
    VALUES (${eventId}, ${nextDrivers[0].id}, ${now}, ${swapNumber})
  `

  return {}
}

export async function pauseRace(eventId: string): Promise<{ error?: string }> {
  await db`
    UPDATE boxboxbox.events
    SET status = 'paused', paused_at = ${new Date().toISOString()}
    WHERE id = ${eventId}
  `
  return {}
}

export async function resumeRace(eventId: string): Promise<{ error?: string }> {
  const rows = await db<{ paused_at: string | null; total_paused_seconds: number }[]>`
    SELECT paused_at, total_paused_seconds FROM boxboxbox.events WHERE id = ${eventId} LIMIT 1
  `
  if (rows.length === 0) return { error: 'Event not found' }

  let additionalPausedSeconds = 0
  if (rows[0].paused_at) {
    additionalPausedSeconds = Math.floor(
      (Date.now() - new Date(rows[0].paused_at).getTime()) / 1000
    )
  }

  await db`
    UPDATE boxboxbox.events
    SET status = 'active',
        paused_at = NULL,
        total_paused_seconds = ${(rows[0].total_paused_seconds ?? 0) + additionalPausedSeconds}
    WHERE id = ${eventId}
  `
  return {}
}

export async function endRace(eventId: string): Promise<{ error?: string }> {
  const now = new Date().toISOString()
  await db`
    UPDATE boxboxbox.stints SET ended_at = ${now}
    WHERE event_id = ${eventId} AND ended_at IS NULL
  `
  await db`UPDATE boxboxbox.events SET status = 'finished' WHERE id = ${eventId}`
  return {}
}

export async function reorderDrivers(
  eventId: string,
  orderedDriverIds: string[]
): Promise<{ error?: string }> {
  const rows = await db<{ status: string }[]>`
    SELECT status FROM boxboxbox.events WHERE id = ${eventId} LIMIT 1
  `
  if (rows.length === 0) return { error: 'Event not found' }
  if (rows[0].status !== 'pending') return { error: 'Cannot reorder drivers after race has started' }

  for (let i = 0; i < orderedDriverIds.length; i++) {
    await db`
      UPDATE boxboxbox.drivers
      SET sequence_order = ${i + 1}
      WHERE id = ${orderedDriverIds[i]} AND event_id = ${eventId}
    `
  }
  return {}
}

export async function addDriverToQueue(
  eventId: string,
  driverName: string
): Promise<{ error?: string; driverId?: string }> {
  const [{ max }] = await db<{ max: number | null }[]>`
    SELECT MAX(sequence_order) as max FROM boxboxbox.drivers WHERE event_id = ${eventId}
  `
  const nextOrder = (max ?? 0) + 1

  const [newDriver] = await db<{ id: string }[]>`
    INSERT INTO boxboxbox.drivers (event_id, name, sequence_order)
    VALUES (${eventId}, ${driverName}, ${nextOrder})
    RETURNING id
  `
  return { driverId: newDriver.id }
}
