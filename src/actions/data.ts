'use server'
import { db } from '@/lib/db'
import { Event, Driver, Stint } from '@/types/database'

export async function getEvent(eventId: string): Promise<Event | null> {
  const rows = await db<Event[]>`
    SELECT * FROM boxboxbox.events WHERE id = ${eventId} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getDrivers(eventId: string): Promise<Driver[]> {
  return db<Driver[]>`
    SELECT * FROM boxboxbox.drivers WHERE event_id = ${eventId} ORDER BY sequence_order
  `
}

export async function getStints(eventId: string): Promise<Stint[]> {
  return db<Stint[]>`
    SELECT * FROM boxboxbox.stints WHERE event_id = ${eventId} ORDER BY swap_number
  `
}
