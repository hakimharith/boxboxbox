export type RaceStatus = 'pending' | 'active' | 'paused' | 'finished'

export interface Event {
  id: string
  name: string
  location: string | null
  race_date: string | null
  start_time: string | null
  total_duration_minutes: number
  race_length: string | null
  num_drivers: number
  max_stint_time_minutes: number | null
  total_swaps_target: number | null
  access_code: string
  status: RaceStatus
  paused_at: string | null
  total_paused_seconds: number
  created_at: string
}

export interface Driver {
  id: string
  event_id: string
  name: string
  sequence_order: number
  created_at: string
}

export interface Stint {
  id: string
  event_id: string
  driver_id: string
  started_at: string
  ended_at: string | null
  swap_number: number
}
