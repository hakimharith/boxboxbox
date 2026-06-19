import { useState, useEffect, useCallback } from 'react'
import { Event, Driver, Stint } from '@/types/database'
import { getEvent, getDrivers, getStints } from '@/actions/data'

interface UseRealtimeSyncParams {
  eventId: string
  initialEvent: Event
  initialDrivers: Driver[]
  initialStints: Stint[]
}

interface UseRealtimeSyncResult {
  event: Event
  drivers: Driver[]
  stints: Stint[]
}

export function useRealtimeSync({
  eventId,
  initialEvent,
  initialDrivers,
  initialStints,
}: UseRealtimeSyncParams): UseRealtimeSyncResult {
  const [event, setEvent] = useState<Event>(initialEvent)
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [stints, setStints] = useState<Stint[]>(initialStints)

  const poll = useCallback(async () => {
    if (!eventId) return
    const [latestEvent, latestDrivers, latestStints] = await Promise.all([
      getEvent(eventId),
      getDrivers(eventId),
      getStints(eventId),
    ])
    if (latestEvent) setEvent(latestEvent)
    setDrivers(latestDrivers)
    setStints(latestStints)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [eventId, poll])

  return { event, drivers, stints }
}
