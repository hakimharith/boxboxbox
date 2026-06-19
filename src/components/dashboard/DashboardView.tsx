'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Play, FlaskConical, Eye, ChevronDown, Trash2 } from 'lucide-react'

import { Event, Driver, Stint } from '@/types/database'
import AppNavBar from '@/components/AppNavBar'
import ShareButton from './ShareButton'
import ReadOnlyShareButton from './ReadOnlyShareButton'
import RaceStatusBanner from './RaceStatusBanner'
import { formatMinSec } from '@/lib/utils/formatTime'
import RaceTimer from './RaceTimer'
import SwapButton from './SwapButton'
import PauseResumeButton from './PauseResumeButton'
import EndRaceButton from './EndRaceButton'
import SwapConfirmModal from './SwapConfirmModal'
import EndRaceConfirmModal from './EndRaceConfirmModal'
import MaxStintAlert from './MaxStintAlert'
import ChequeredFlagModal from './ChequeredFlagModal'
import PauseConfirmModal from './PauseConfirmModal'

// ────────────────────────────────────────────────────────────────
// Sortable slot row (pre-start sequence planning)
// ────────────────────────────────────────────────────────────────

interface SlotItem {
  id: string
  driverId: string
}

function SortableSlotRow({
  slot,
  index,
  drivers,
  onChange,
  onDelete,
}: {
  slot: SlotItem
  index: number
  drivers: Driver[]
  onChange: (slotId: string, driverId: string) => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2 px-2 border-b border-brand-border last:border-b-0"
    >
      <button
        type="button"
        className="text-brand-txt3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <div className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-mono font-bold flex-shrink-0 border bg-brand-bg4 text-brand-txt2 border-brand-border2">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="flex-1 relative flex items-center">
        <ChevronDown size={11} className="absolute left-1 text-brand-txt3 pointer-events-none flex-shrink-0" />
        <select
          value={slot.driverId}
          onChange={(e) => onChange(slot.id, e.target.value)}
          className="w-full appearance-none pl-5 bg-transparent text-[10px] text-brand-txt font-mono outline-none cursor-pointer"
        >
          {drivers.map((d) => (
            <option key={d.id} value={d.id} className="bg-brand-bg3 text-brand-txt">
              {d.name}
            </option>
          ))}
        </select>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-brand-txt3 hover:text-brand-red transition-colors flex-shrink-0 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────

export interface DashboardViewProps {
  event: Event
  drivers: Driver[]
  stints: Stint[]
  isHost: boolean
  elapsed: number
  remaining: number
  currentStintElapsed: number
  isFlashing: boolean
  isPaused: boolean
  isTestMode: boolean
  testModeElapsed: number
  testModeRemaining: number
  showSwapModal: boolean
  showEndModal: boolean
  showMaxStintAlert: boolean
  showChequeredFlag: boolean
  minutesUntilMaxStint: number
  onSwap: () => void
  onConfirmSwap: () => void
  onCancelSwap: () => void
  onPause: () => void
  onResume: () => void
  onStartRace: () => void
  onEndRace: () => void
  onConfirmEnd: () => void
  onCancelEnd: () => void
  onAcknowledgeAlert: () => void
  onAddDriverToQueue: (driverId: string) => void
  onAddNewDriver?: (name: string) => void
  onExitTestMode: () => void
  onStartTestMode: () => void
  onReorderDrivers?: (drivers: Driver[]) => void
  isReadOnly?: boolean
  pollProgress?: number
}

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────

export default function DashboardView({
  event,
  drivers,
  stints,
  isHost,
  elapsed,
  remaining,
  currentStintElapsed,
  isFlashing,
  isPaused,
  isTestMode,
  testModeElapsed,
  testModeRemaining,
  showSwapModal,
  showEndModal,
  showMaxStintAlert,
  showChequeredFlag,
  minutesUntilMaxStint,
  onSwap,
  onConfirmSwap,
  onCancelSwap,
  onPause,
  onResume,
  onStartRace,
  onEndRace,
  onConfirmEnd,
  onCancelEnd,
  onAcknowledgeAlert,
  onAddDriverToQueue,
  onAddNewDriver,
  onExitTestMode,
  onStartTestMode,
  onReorderDrivers,
  isReadOnly = false,
  pollProgress,
}: DashboardViewProps) {
  void remaining
  void testModeRemaining

  const router = useRouter()
  const sensors = useSensors(useSensor(PointerSensor))

  const [slots, setSlots] = useState<SlotItem[]>(() => {
    const ordered = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)
    const total = event.total_swaps_target ?? ordered.length
    return Array.from({ length: total }, (_, i) => ({
      id: `slot-${i}`,
      driverId: ordered[i % ordered.length]?.id ?? '',
    }))
  })

  const sortedDriversForSlots = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)

  const [showPauseModal, setShowPauseModal] = useState(false)
  const [localExtraQueue, setLocalExtraQueue] = useState<string[]>([])
  const [localNewDrivers, setLocalNewDrivers] = useState<Driver[]>([])
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [newDriverName, setNewDriverName] = useState('')
  const [editingStints, setEditingStints] = useState(false)
  const [editSlots, setEditSlots] = useState<SlotItem[]>([])
  const [editSlotsInitialCount, setEditSlotsInitialCount] = useState(0)
  const [localUpNextList, setLocalUpNextList] = useState<Array<{ name: string; driverId: string }> | null>(null)

  function deriveAndSave(nextSlots: SlotItem[]) {
    const driverMap = new Map(drivers.map(d => [d.id, d]))
    const seen = new Set<string>()
    const orderedDrivers: Driver[] = []
    for (const { driverId } of nextSlots) {
      if (driverId && !seen.has(driverId)) {
        const d = driverMap.get(driverId)
        if (d) { seen.add(driverId); orderedDrivers.push(d) }
      }
    }
    onReorderDrivers?.(orderedDrivers)
  }

  function handleSlotDriverChange(slotId: string, driverId: string) {
    const next = slots.map(s => s.id === slotId ? { ...s, driverId } : s)
    setSlots(next)
    deriveAndSave(next)
  }

  function handleSlotDragEnd(dragEvent: DragEndEvent) {
    const { active, over } = dragEvent
    if (!over || active.id === over.id) return
    const oldIndex = slots.findIndex(s => s.id === active.id)
    const newIndex = slots.findIndex(s => s.id === over.id)
    const next = arrayMove(slots, oldIndex, newIndex)
    setSlots(next)
    deriveAndSave(next)
  }

  function handleEditSlotDriverChange(slotId: string, driverId: string) {
    setEditSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, driverId } : s))
  }

  function handleEditDragEnd(dragEvent: DragEndEvent) {
    const { active, over } = dragEvent
    if (!over || active.id === over.id) return
    const oldIndex = editSlots.findIndex(s => s.id === active.id)
    const newIndex = editSlots.findIndex(s => s.id === over.id)
    setEditSlots(arrayMove(editSlots, oldIndex, newIndex))
  }

  function openEditStints() {
    const displayList = localUpNextList ?? upNextList
    const initial = displayList.map((entry, i) => ({
      id: `edit-${i}-${Date.now()}`,
      driverId: entry.driverId,
    }))
    setEditSlots(initial)
    setEditSlotsInitialCount(initial.length)
    setEditingStints(true)
  }

  function addEditSlot() {
    setEditSlots((prev) => [
      ...prev,
      { id: `edit-new-${Date.now()}`, driverId: drivers[0]?.id ?? '' },
    ])
  }

  function deleteEditSlot(slotId: string) {
    setEditSlots((prev) => prev.filter((s) => s.id !== slotId))
  }

  function confirmAddDriver() {
    const name = newDriverName.trim()
    if (!name) return
    const tempId = `local-driver-${Date.now()}`
    const newDriver: Driver = {
      id: tempId,
      event_id: event.id,
      name,
      sequence_order: drivers.length + localNewDrivers.length,
      created_at: new Date().toISOString(),
    }
    setLocalNewDrivers((prev) => [...prev, newDriver])
    setEditSlots((prev) => [...prev, { id: `edit-new-${Date.now()}`, driverId: tempId }])
    onAddNewDriver?.(name)
    setNewDriverName('')
    setShowAddDriver(false)
  }

  function saveEditStints() {
    const driverMap = new Map(allDrivers.map((d) => [d.id, d]))
    const seen = new Set<string>()
    const orderedDrivers: Driver[] = []
    for (const { driverId } of editSlots) {
      if (driverId && !seen.has(driverId)) {
        const d = driverMap.get(driverId)
        if (d) { seen.add(driverId); orderedDrivers.push(d) }
      }
    }
    onReorderDrivers?.(orderedDrivers)
    const extraIds = editSlots.slice(computedUpNext.length).map((s) => s.driverId)
    const prevLen = localExtraQueue.length
    setLocalExtraQueue(extraIds)
    for (const driverId of extraIds.slice(prevLen)) {
      onAddDriverToQueue(driverId)
    }
    const allDriverMap = new Map(allDrivers.map((d) => [d.id, d]))
    setLocalUpNextList(editSlots.map((s) => ({
      name: allDriverMap.get(s.driverId)?.name ?? 'Unknown',
      driverId: s.driverId,
    })))
    setEditingStints(false)
  }

  const allDrivers = [...drivers, ...localNewDrivers]

  const activeStint = stints.find((s) => s.ended_at === null) ?? null
  const currentDriver = activeStint
    ? drivers.find((d) => d.id === activeStint.driver_id) ?? null
    : null

  const completedStints = stints.filter((s) => s.ended_at !== null)
  const swapCount = completedStints.length

  const sortedDrivers = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)
  const currentIndex = currentDriver
    ? sortedDrivers.findIndex((d) => d.id === currentDriver.id)
    : -1

  const nextDriver =
    sortedDrivers.length > 0
      ? sortedDrivers[(currentIndex + 1) % sortedDrivers.length] ?? null
      : null

  const totalSwaps = event.total_swaps_target ?? sortedDrivers.length
  const remainingSlots = Math.max(0, totalSwaps - swapCount - 1)
  const computedUpNext = sortedDrivers.length > 1
    ? Array.from({ length: remainingSlots }, (_, i) => {
        const driver = sortedDrivers[(currentIndex + 2 + i) % sortedDrivers.length]
        return { name: driver?.name ?? '', driverId: driver?.id ?? '' }
      })
    : []
  const extraEntries = localExtraQueue.map((id) => ({
    name: drivers.find((d) => d.id === id)?.name ?? 'Unknown',
    driverId: id,
  }))
  const upNextList = [...computedUpNext, ...extraEntries]
  const displayUpNextList = localUpNextList ?? upNextList

  const nextSwapNumber = swapCount + 1
  const nextDriverObj = nextDriver
  const displayElapsed = isTestMode ? testModeElapsed : elapsed

  // Status badge
  function StatusBadge() {
    if (isTestMode) {
      return null
    }
    if (event.status === 'finished') {
      return (
        <span className="badge badge-ghost text-[8px] font-condensed font-bold uppercase tracking-wide border-brand-border2">
          FINISHED
        </span>
      )
    }
    return null
  }

  return (
    <div className="min-h-dvh race-bg text-brand-txt flex flex-col">
      {/* Shared navbar */}
      <AppNavBar
        backHref="/"
        backLabel="Home"
        centerSlot={
          <div className="flex items-center gap-2 min-w-0">
            <StatusBadge />
            {!isHost && !isReadOnly && (
              <span className="badge badge-outline badge-info text-[9px] font-condensed font-bold uppercase tracking-wide gap-1 flex-shrink-0">
                <Eye size={9} aria-hidden="true" /> Viewer
              </span>
            )}
          </div>
        }
      />

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3 max-w-sm mx-auto w-full">

        {/* ── PENDING ── */}
        {event.status === 'pending' && !isTestMode && (
          <div className="flex-1 flex flex-col justify-center">
            <RaceStatusBanner status="pending" startTime={event.start_time} eventName={event.name} location={event.location ?? undefined} />

            {isHost && (
              <>
                <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">
                  Stint sequence
                </p>
                <div className="bg-brand-bg3 border border-brand-border rounded px-3 mb-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSlotDragEnd}
                  >
                    <SortableContext
                      items={slots.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {slots.map((slot, i) => (
                        <SortableSlotRow
                          key={slot.id}
                          slot={slot}
                          index={i}
                          drivers={sortedDriversForSlots}
                          onChange={handleSlotDriverChange}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onStartRace}
                    className="btn btn-primary min-h-[52px] gap-1.5"
                  >
                    <Play size={14} />
                    Start now
                  </button>
                  <button
                    type="button"
                    onClick={onStartTestMode}
                    className="btn btn-ghost border border-brand-border2 min-h-[52px] gap-1.5 hover:bg-brand-bg5"
                  >
                    <FlaskConical size={14} />
                    Test mode
                  </button>
                </div>
              </>
            )}

            {!isHost && (
              <div className="bg-brand-bg4 border border-dashed border-brand-border2 rounded px-3 py-4 text-center mt-4">
                <p className="text-[9px] font-mono uppercase tracking-wide text-brand-txt3">
                  Waiting for host to start the race…
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── FINISHED ── */}
        {event.status === 'finished' && !showChequeredFlag && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-brand-bg2 border border-brand-border rounded px-4 py-5 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">Race Complete</p>
              <h2 className="font-display text-lg font-bold uppercase text-brand-txt mb-0.5">{event.name}</h2>
              {event.location && (
                <p className="font-mono text-[10px] text-brand-txt3 uppercase mb-3">{event.location}</p>
              )}
              <button
                type="button"
                onClick={() => router.push(`/event/${event.id}/results`)}
                className="btn btn-primary w-full"
              >
                View Results →
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE / TEST / PAUSED ── */}
        {(event.status === 'active' || event.status === 'paused' || isTestMode) && (
          <div className="flex-1 flex flex-col justify-center">
            {isPaused && <div className="pause-stripe mb-2" />}

            {showMaxStintAlert && currentDriver && (
              <MaxStintAlert
                isVisible={showMaxStintAlert}
                driverName={currentDriver.name}
                minutesLeft={minutesUntilMaxStint}
                onAcknowledge={onAcknowledgeAlert}
              />
            )}

            {/* Dashboard card */}
            <div className="bg-brand-bg3 border border-brand-border rounded-lg overflow-hidden mb-3">

              {/* Card title */}
              <div className="px-3 pt-3 pb-2 border-b border-brand-border/60 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-condensed text-base font-bold uppercase tracking-wider text-brand-txt leading-tight truncate">
                    {event.name}
                  </p>
                  {(event.location || event.max_stint_time_minutes) && (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {event.location && (
                        <span className="text-[10px] font-mono text-brand-txt3 truncate">{event.location}</span>
                      )}
                      {event.location && event.max_stint_time_minutes && (
                        <span className="text-[10px] font-mono text-brand-txt3">·</span>
                      )}
                      {event.max_stint_time_minutes && (
                        <span className="text-[10px] font-mono text-brand-txt3">Max {event.max_stint_time_minutes} mins/stint</span>
                      )}
                    </div>
                  )}
                  {!isReadOnly && (
                    <div className="flex items-center gap-2 mt-2">
                      <ShareButton eventName={event.name} accessCode={event.access_code} />
                      {isHost && <ReadOnlyShareButton eventId={event.id} />}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {isTestMode ? (
                    <span className="badge badge-outline badge-accent text-[9px] font-mono font-bold uppercase tracking-widest">
                      Test
                    </span>
                  ) : isPaused ? (
                    <span className="badge badge-warning text-[9px] font-mono font-bold uppercase tracking-widest">
                      Paused
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="live-dot" />
                      <span className="badge badge-success text-[9px] font-mono font-bold uppercase tracking-widest">
                        Live
                      </span>
                    </div>
                  )}
                  {isReadOnly && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px] text-brand-txt3 uppercase tracking-widest">Spectator View</span>
                      {pollProgress !== undefined && (
                        <svg width="12" height="12" viewBox="0 0 14 14" className="flex-shrink-0 -rotate-90">
                          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-border2" />
                          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset={31.4 * (1 - pollProgress / 100)} className="text-brand-cyan" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 py-3 flex flex-col gap-2.5">

                {/* Exit test mode button */}
                {isHost && isTestMode && (
                  <button
                    type="button"
                    onClick={onExitTestMode}
                    className="btn btn-ghost border border-brand-purple/30 text-brand-purple w-full btn-sm gap-1 hover:border-brand-purple/50"
                  >
                    Exit Test Mode — no data saved
                  </button>
                )}

                {/* Host controls */}
                {isHost && (
                  <div className="flex gap-1.5">
                    <PauseResumeButton
                      isHost={isHost}
                      isPaused={isPaused}
                      onPause={() => setShowPauseModal(true)}
                      onResume={onResume}
                    />
                    <EndRaceButton isHost={isHost} onEnd={onEndRace} />
                  </div>
                )}

                {!isHost && !isReadOnly && (
                  <div className="bg-brand-bg4 border border-dashed border-brand-border2 rounded px-3 py-2 text-center">
                    <p className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-brand-txt3">
                      <Eye size={10} aria-hidden="true" /> View only — controls visible to host only
                    </p>
                  </div>
                )}

                {/* Overview subheading */}
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-txt2 -mb-1">Overview</p>

                {/* Row 1: Elapsed | Current Stint | Swaps */}
                <RaceTimer
                  elapsed={displayElapsed}
                  currentStintElapsed={currentStintElapsed}
                  swapCount={swapCount}
                  swapsTarget={event.total_swaps_target}
                  isTestMode={isTestMode}
                  isPaused={isPaused}
                  isFlashing={isFlashing}
                />

                {/* Drivers subheading */}
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-txt2 -mb-1">Drivers</p>

                {/* Row 2: Current Driver | Next Driver */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`bg-brand-bg border border-brand-border rounded px-2 py-2.5 flex flex-col${isFlashing && !isPaused ? ' card-flash' : ''}`}>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">Current</p>
                    <div className="font-mono text-xl font-bold leading-tight text-brand-txt truncate text-center">
                      {currentDriver?.name ?? '—'}
                    </div>
                  </div>
                  <div className="bg-brand-bg border border-brand-border rounded px-2 py-2.5 flex flex-col">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">Next</p>
                    <div className="font-mono text-xl font-bold leading-tight text-brand-txt truncate text-center">
                      {nextDriver?.name ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Swap button */}
                {isHost && !isPaused && (
                  <div className="flex">
                    <SwapButton
                      isHost={isHost}
                      nextDriverName={nextDriver?.name ?? null}
                      onSwap={onSwap}
                      isTestMode={isTestMode}
                    />
                  </div>
                )}

                {/* Row 3: Upcoming stints */}
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-txt2 mb-1">Upcoming Stints</p>

                  {!editingStints ? (
                    <>
                      <div className="bg-brand-bg border border-brand-border rounded overflow-hidden">
                        <div className="flex items-center gap-2 px-2 py-1 border-b border-brand-border bg-brand-bg3">
                          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3 w-8 flex-shrink-0">Stint</span>
                          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3">Driver</span>
                        </div>
                        {displayUpNextList.length === 0 ? (
                          <p className="text-[9px] font-mono text-brand-txt3 px-2 py-1.5">No upcoming stints</p>
                        ) : (
                          displayUpNextList.map((entry, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-2 py-1.5 border-b border-brand-border/50 last:border-b-0"
                            >
                              <span className="text-xs font-mono text-brand-txt3 w-8 flex-shrink-0">
                                {swapCount + i + 2}
                              </span>
                              <span className="font-condensed text-sm text-brand-txt truncate">{entry.name}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {isHost && (
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={openEditStints}
                            className="btn btn-ghost border border-brand-border2 w-full min-h-[52px] gap-1.5 hover:bg-brand-bg5"
                          >
                            Edit Stints
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-brand-bg border border-brand-border rounded overflow-hidden">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleEditDragEnd}
                      >
                        <SortableContext
                          items={editSlots.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {editSlots.map((slot, i) => (
                            <SortableSlotRow
                              key={slot.id}
                              slot={slot}
                              index={i}
                              drivers={[...sortedDriversForSlots, ...localNewDrivers]}
                              onChange={handleEditSlotDriverChange}
                              onDelete={i >= editSlotsInitialCount ? () => deleteEditSlot(slot.id) : undefined}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      <div className="px-2 py-2 border-t border-brand-border/50">
                        <div className="flex gap-1.5 mb-1.5">
                          <button
                            type="button"
                            onClick={addEditSlot}
                            className="btn btn-ghost border border-brand-border2 flex-1 btn-sm hover:bg-brand-bg5"
                          >
                            + Add Stint
                          </button>
                        </div>

                        {/* Add Driver */}
                        {showAddDriver ? (
                          <div className="flex gap-1.5 items-center mb-1.5">
                            <input
                              type="text"
                              value={newDriverName}
                              onChange={(e) => setNewDriverName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && confirmAddDriver()}
                              placeholder="Driver name"
                              autoFocus
                              className="input input-bordered input-sm flex-1 font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={confirmAddDriver}
                              className="btn btn-ghost border border-brand-border2 btn-sm flex-shrink-0 hover:bg-brand-bg5"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddDriver(false); setNewDriverName('') }}
                              className="btn btn-ghost btn-sm text-brand-txt3 hover:text-brand-txt flex-shrink-0 px-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 mb-1.5">
                            <button
                              type="button"
                              onClick={() => setShowAddDriver(true)}
                              className="btn btn-ghost border border-brand-border2 flex-1 btn-sm hover:bg-brand-bg5"
                            >
                              + Add Driver
                            </button>
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingStints(false)}
                            className="btn btn-error flex-1 btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEditStints}
                            className="btn btn-primary flex-1 btn-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 4: Completed stints */}
                {completedStints.length > 0 && (
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-txt2 mb-1">Completed Stints</p>
                    <div className="bg-brand-bg border border-brand-border rounded overflow-hidden">
                      <div className="flex items-center gap-2 px-2 py-1 border-b border-brand-border bg-brand-bg3">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3 w-8 flex-shrink-0">Stint</span>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3 flex-1">Driver</span>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-txt3">Time</span>
                      </div>
                      {[...completedStints]
                        .sort((a, b) => b.swap_number - a.swap_number)
                        .map((stint) => {
                          const driverName = drivers.find((d) => d.id === stint.driver_id)?.name ?? 'Unknown'
                          const duration = stint.ended_at
                            ? Math.floor(
                                (new Date(stint.ended_at).getTime() - new Date(stint.started_at).getTime()) / 1000
                              )
                            : 0
                          return (
                            <div
                              key={stint.id}
                              className="flex items-center gap-2 px-2 py-1.5 border-b border-brand-border/50 last:border-b-0 font-mono text-xs"
                            >
                              <span className="text-brand-txt3 w-8 flex-shrink-0 tabular-nums">
                                {stint.swap_number}
                              </span>
                              <span className="text-brand-txt flex-1 truncate">{driverName}</span>
                              <span className="text-brand-txt2 tabular-nums">{formatMinSec(duration)}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PauseConfirmModal
        isOpen={showPauseModal}
        onConfirm={() => { onPause(); setShowPauseModal(false) }}
        onCancel={() => setShowPauseModal(false)}
      />

      <SwapConfirmModal
        isOpen={showSwapModal}
        currentDriver={currentDriver}
        nextDriver={nextDriverObj}
        currentStintElapsed={currentStintElapsed}
        swapNumber={nextSwapNumber}
        onConfirm={onConfirmSwap}
        onCancel={onCancelSwap}
      />

      <EndRaceConfirmModal
        isOpen={showEndModal}
        event={event}
        currentDriver={currentDriver}
        elapsed={displayElapsed}
        swapCount={swapCount}
        currentStintElapsed={currentStintElapsed}
        onConfirm={onConfirmEnd}
        onCancel={onCancelEnd}
      />

      <ChequeredFlagModal
        isOpen={showChequeredFlag}
        event={event}
        stints={stints}
        drivers={drivers}
        totalTime={displayElapsed}
        onViewResults={() => router.push(`/event/${event.id}/results`)}
      />
    </div>
  )
}
