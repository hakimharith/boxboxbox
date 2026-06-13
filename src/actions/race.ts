'use server'

import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────
// startRace
// ─────────────────────────────────────────────────────────────
export async function startRace(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { error: 'Event not found' }
  }

  const now = new Date()
  let startTime: Date

  if (event.start_time === null) {
    // No start time set — use now
    startTime = now
  } else {
    const existingStartTime = new Date(event.start_time)
    if (existingStartTime > now) {
      // Future start time — force start now
      startTime = now
    } else {
      // Past start time
      const hoursAgo = (now.getTime() - existingStartTime.getTime()) / 1000 / 3600
      if (hoursAgo > 24) {
        return { error: 'Start time cannot be more than 24 hours ago' }
      }
      startTime = existingStartTime
    }
  }

  // Update event: status = active, set start_time
  const { error: updateError } = await supabase
    .from('events')
    .update({
      status: 'active',
      start_time: startTime.toISOString(),
    })
    .eq('id', eventId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Find driver with sequence_order = 1
  const { data: firstDriver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('event_id', eventId)
    .order('sequence_order', { ascending: true })
    .limit(1)
    .single()

  if (driverError || !firstDriver) {
    return { error: 'No drivers found for this event' }
  }

  // Check if a stint already exists (idempotent guard)
  const { data: existingStints } = await supabase
    .from('stints')
    .select('id')
    .eq('event_id', eventId)
    .limit(1)

  if (existingStints && existingStints.length > 0) {
    // Already started — return success
    return {}
  }

  // Insert first stint
  const { error: stintError } = await supabase.from('stints').insert({
    event_id: eventId,
    driver_id: firstDriver.id,
    started_at: startTime.toISOString(),
    swap_number: 1,
  })

  if (stintError) {
    return { error: stintError.message }
  }

  return {}
}

// ─────────────────────────────────────────────────────────────
// swapDriver
// ─────────────────────────────────────────────────────────────
export async function swapDriver(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Find current open stint
  const { data: currentStint, error: stintError } = await supabase
    .from('stints')
    .select('*, drivers(*)')
    .eq('event_id', eventId)
    .is('ended_at', null)
    .single()

  if (stintError || !currentStint) {
    return { error: 'No active stint found' }
  }

  // Get current driver's sequence_order
  const { data: currentDriver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', currentStint.driver_id)
    .single()

  if (driverError || !currentDriver) {
    return { error: 'Current driver not found' }
  }

  // Count total drivers for this event
  const { count: totalDrivers } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if (!totalDrivers) {
    return { error: 'No drivers found' }
  }

  // Find next driver: circular rotation
  const nextOrder = (currentDriver.sequence_order % totalDrivers) + 1

  const { data: nextDriver, error: nextDriverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('event_id', eventId)
    .eq('sequence_order', nextOrder)
    .single()

  if (nextDriverError || !nextDriver) {
    return { error: 'Next driver not found' }
  }

  // Close current stint
  const { error: closeError } = await supabase
    .from('stints')
    .update({ ended_at: now })
    .eq('id', currentStint.id)

  if (closeError) {
    return { error: closeError.message }
  }

  // Count total stints for this event to determine swap_number
  const { count: stintCount } = await supabase
    .from('stints')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const swapNumber = (stintCount ?? 1) + 1

  // Insert new stint
  const { error: insertError } = await supabase.from('stints').insert({
    event_id: eventId,
    driver_id: nextDriver.id,
    started_at: now,
    swap_number: swapNumber,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  return {}
}

// ─────────────────────────────────────────────────────────────
// pauseRace
// ─────────────────────────────────────────────────────────────
export async function pauseRace(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
    })
    .eq('id', eventId)

  if (error) return { error: error.message }
  return {}
}

// ─────────────────────────────────────────────────────────────
// resumeRace
// ─────────────────────────────────────────────────────────────
export async function resumeRace(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Fetch current event to get paused_at and total_paused_seconds
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('paused_at, total_paused_seconds')
    .eq('id', eventId)
    .single()

  if (fetchError || !event) {
    return { error: 'Event not found' }
  }

  let additionalPausedSeconds = 0
  if (event.paused_at) {
    const pausedAt = new Date(event.paused_at).getTime()
    additionalPausedSeconds = Math.floor((Date.now() - pausedAt) / 1000)
  }

  const { error } = await supabase
    .from('events')
    .update({
      status: 'active',
      paused_at: null,
      total_paused_seconds: (event.total_paused_seconds ?? 0) + additionalPausedSeconds,
    })
    .eq('id', eventId)

  if (error) return { error: error.message }
  return {}
}

// ─────────────────────────────────────────────────────────────
// endRace
// ─────────────────────────────────────────────────────────────
export async function endRace(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Close any open stint (idempotent — if none exists, no error)
  await supabase
    .from('stints')
    .update({ ended_at: now })
    .eq('event_id', eventId)
    .is('ended_at', null)

  // Update event status to finished
  const { error } = await supabase
    .from('events')
    .update({ status: 'finished' })
    .eq('id', eventId)

  if (error) return { error: error.message }
  return {}
}

// ─────────────────────────────────────────────────────────────
// reorderDrivers
// ─────────────────────────────────────────────────────────────
export async function reorderDrivers(
  eventId: string,
  orderedDriverIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Only allowed when status = 'pending'
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .single()

  if (fetchError || !event) {
    return { error: 'Event not found' }
  }

  if (event.status !== 'pending') {
    return { error: 'Cannot reorder drivers after race has started' }
  }

  // Update each driver's sequence_order
  const updates = orderedDriverIds.map((driverId, index) =>
    supabase
      .from('drivers')
      .update({ sequence_order: index + 1 })
      .eq('id', driverId)
      .eq('event_id', eventId)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    return { error: firstError.error.message }
  }

  return {}
}

// ─────────────────────────────────────────────────────────────
// addDriverToQueue
// ─────────────────────────────────────────────────────────────
export async function addDriverToQueue(
  eventId: string,
  driverName: string
): Promise<{ error?: string; driverId?: string }> {
  const supabase = await createClient()

  // Find max sequence_order for this event
  const { data: drivers, error: fetchError } = await supabase
    .from('drivers')
    .select('sequence_order')
    .eq('event_id', eventId)
    .order('sequence_order', { ascending: false })
    .limit(1)

  if (fetchError) {
    return { error: fetchError.message }
  }

  const maxOrder = drivers && drivers.length > 0 ? drivers[0].sequence_order : 0

  // Insert new driver at end of queue
  const { data: newDriver, error: insertError } = await supabase
    .from('drivers')
    .insert({
      event_id: eventId,
      name: driverName,
      sequence_order: maxOrder + 1,
    })
    .select('id')
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  return { driverId: newDriver?.id }
}
