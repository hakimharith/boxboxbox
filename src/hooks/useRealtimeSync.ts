import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Event, Driver, Stint } from '@/types/database'

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

  // Update state when initial values change (e.g. after server-side refetch)
  useEffect(() => {
    setEvent(initialEvent)
  }, [initialEvent])

  useEffect(() => {
    setDrivers(initialDrivers)
  }, [initialDrivers])

  useEffect(() => {
    setStints(initialStints)
  }, [initialStints])

  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setEvent(payload.new as Event)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stints',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setStints((prev) => {
              const exists = prev.some((s) => s.id === (payload.new as Stint).id)
              if (exists) return prev
              return [...prev, payload.new as Stint]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stints',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setStints((prev) =>
              prev.map((s) =>
                s.id === (payload.new as Stint).id ? (payload.new as Stint) : s
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drivers',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setDrivers((prev) => {
              const exists = prev.some((d) => d.id === (payload.new as Driver).id)
              if (exists) return prev
              return [...prev, payload.new as Driver].sort(
                (a, b) => a.sequence_order - b.sequence_order
              )
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setDrivers((prev) =>
              prev
                .map((d) =>
                  d.id === (payload.new as Driver).id ? (payload.new as Driver) : d
                )
                .sort((a, b) => a.sequence_order - b.sequence_order)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  return { event, drivers, stints }
}
