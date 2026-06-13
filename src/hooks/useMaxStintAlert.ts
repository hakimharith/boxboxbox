import { useState, useEffect, useRef } from 'react'

interface UseMaxStintAlertParams {
  stintElapsed: number
  maxStintMinutes: number | null
  stintId: string | null
}

interface UseMaxStintAlertResult {
  isFlashing: boolean
  showAlertModal: boolean
  minutesLeft: number
  acknowledgeAlert: () => void
}

export function useMaxStintAlert({
  stintElapsed,
  maxStintMinutes,
  stintId,
}: UseMaxStintAlertParams): UseMaxStintAlertResult {
  const [isFlashing, setIsFlashing] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertAcknowledged, setAlertAcknowledged] = useState(false)
  const [alertModalShown, setAlertModalShown] = useState(false)

  // Track previous stintId to detect stint changes
  const prevStintIdRef = useRef<string | null>(stintId)

  // Reset all state when stintId changes (driver swap)
  useEffect(() => {
    if (prevStintIdRef.current !== stintId) {
      prevStintIdRef.current = stintId
      setIsFlashing(false)
      setShowAlertModal(false)
      setAlertAcknowledged(false)
      setAlertModalShown(false)
    }
  }, [stintId])

  // Alert logic — runs on every stintElapsed tick
  useEffect(() => {
    if (maxStintMinutes === null || stintId === null) {
      setIsFlashing(false)
      setShowAlertModal(false)
      return
    }

    const stintElapsedMinutes = stintElapsed / 60
    const timeUntilMax = maxStintMinutes - stintElapsedMinutes

    if (timeUntilMax <= 5 && !alertAcknowledged) {
      setIsFlashing(true)
      if (!alertModalShown) {
        setShowAlertModal(true)
        setAlertModalShown(true)
      }
    }
  }, [stintElapsed, maxStintMinutes, stintId, alertAcknowledged, alertModalShown])

  function acknowledgeAlert() {
    setAlertAcknowledged(true)
    setIsFlashing(false)
    setShowAlertModal(false)
  }

  const minutesLeft =
    maxStintMinutes !== null
      ? Math.max(0, Math.ceil(maxStintMinutes - stintElapsed / 60))
      : 0

  return { isFlashing, showAlertModal, minutesLeft, acknowledgeAlert }
}
