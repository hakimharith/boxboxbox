'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from './actions'
import { setHostSession } from '@/types/app'
import AppNavBar from '@/components/AppNavBar'

const labelCls = 'text-xs uppercase font-bold font-mono text-brand-txt3 mb-1 block'

interface DriverItem {
  id: string
  name: string
}

function DriverRow({
  item,
  index,
  onChange,
}: {
  item: DriverItem
  index: number
  onChange: (id: string, name: string) => void
}) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <div className="flex items-center gap-2 py-2 border-b border-brand-border last:border-b-0">
      <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 border bg-brand-bg4 text-brand-txt2 border-brand-border2">
        {num}
      </div>
      <input
        type="text"
        value={item.name}
        placeholder={`Driver ${num}`}
        onChange={(e) => onChange(item.id, e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm text-brand-txt placeholder:text-brand-txt3 px-1"
      />
    </div>
  )
}

interface Step1Data {
  name: string
  location: string
  raceDate: string
  startTime: string
  durationHours: string
  durationMinutes: string
  numDrivers: string
  totalSwapsTarget: string
  maxStintTimeMinutes: string
}

function StepRaceDetails({
  data,
  onChange,
  onNext,
}: {
  data: Step1Data
  onChange: (d: Step1Data) => void
  onNext: () => void
}) {
  const [error, setError] = useState('')

  function set(field: keyof Step1Data, value: string) {
    onChange({ ...data, [field]: value })
  }

  function handleNext() {
    if (!data.name.trim()) return setError('Event name is required.')
    if (!data.raceDate) return setError('Race date is required.')
    if (!data.startTime) return setError('Start time is required.')

    const startDateTime = new Date(`${data.raceDate}T${data.startTime}`)
    const now = new Date()
    const diffMs = now.getTime() - startDateTime.getTime()
    if (diffMs > 24 * 60 * 60 * 1000) {
      return setError('Start time cannot be more than 24 hours in the past.')
    }

    if (!data.durationHours && !data.durationMinutes)
      return setError('Total race duration is required.')
    if (!data.numDrivers || Number(data.numDrivers) < 1)
      return setError('Number of drivers is required.')
    setError('')
    onNext()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2">
        <p className="font-mono text-[10px] text-brand-txt3 uppercase tracking-widest mb-0.5">Step 1 / 2</p>
        <h1 className="font-condensed text-2xl font-bold uppercase tracking-wider text-brand-txt leading-none">
          Event Details
        </h1>
      </div>

      <div>
        <label className={labelCls}>Event name</label>
        <input
          className="input input-bordered w-full"
          type="text"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Team Rocket Endurance Cup"
        />
      </div>

      <div>
        <label className={labelCls}>Location / Track</label>
        <input
          className="input input-bordered w-full"
          type="text"
          value={data.location}
          onChange={(e) => set('location', e.target.value)}
          placeholder="Kartdrome Singapore"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Race date</label>
          <input
            className="input input-bordered w-full"
            type="date"
            value={data.raceDate}
            onChange={(e) => set('raceDate', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Start time</label>
          <input
            className="input input-bordered w-full"
            type="time"
            value={data.startTime}
            onChange={(e) => set('startTime', e.target.value)}
          />
          <p className="font-mono text-[10px] text-brand-txt3 mt-1">Can be up to 24h in the past</p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Duration</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-brand-txt3 uppercase tracking-wide mb-1 block">Hours</label>
            <input
              className="input input-bordered w-full"
              type="number"
              min="0"
              max="24"
              value={data.durationHours}
              onChange={(e) => set('durationHours', e.target.value)}
              placeholder="3"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-brand-txt3 uppercase tracking-wide mb-1 block">Mins</label>
            <input
              className="input input-bordered w-full"
              type="number"
              min="0"
              max="59"
              value={data.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>No. of drivers <span className="normal-case font-normal">(Max 20)</span></label>
        <input
          className="input input-bordered w-full"
          type="number"
          min="1"
          max="20"
          value={data.numDrivers}
          onChange={(e) => set('numDrivers', e.target.value)}
          placeholder="4"
        />
      </div>

      <div className="border-t border-brand-border pt-2 mt-1">
        <p className="font-mono text-[10px] text-brand-txt3 uppercase tracking-widest mb-2">Optional Fields</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Total swaps</label>
            <input
              className="input input-bordered w-full"
              type="number"
              min="1"
              value={data.totalSwapsTarget}
              onChange={(e) => set('totalSwapsTarget', e.target.value)}
              placeholder="12"
            />
            {data.totalSwapsTarget && (
              <p className="font-mono text-[10px] text-brand-txt3 mt-1">
                Shows X / {data.totalSwapsTarget} on dashboard
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Max Stint (Mins)</label>
            <input
              className="input w-full bg-brand-purple/10 border border-brand-purple/30 focus:border-brand-purple/60 focus:outline-none"
              type="number"
              min="1"
              value={data.maxStintTimeMinutes}
              onChange={(e) => set('maxStintTimeMinutes', e.target.value)}
              placeholder="45"
            />
            <p className="font-mono text-[10px] text-brand-purple mt-1">Alerts 5 min before</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error py-2 text-xs font-mono">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        className="btn btn-primary w-full min-h-[52px] mt-1"
      >
        Next
      </button>
    </div>
  )
}

function StepDrivers({
  numDrivers,
  drivers,
  onDriversChange,
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  numDrivers: number
  drivers: DriverItem[]
  onDriversChange: (d: DriverItem[]) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  submitError: string
}) {
  void numDrivers

  function handleNameChange(id: string, name: string) {
    onDriversChange(drivers.map((d) => (d.id === id ? { ...d, name } : d)))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2">
        <p className="font-mono text-[10px] text-brand-txt3 uppercase tracking-widest mb-0.5">Step 2 / 2</p>
        <h1 className="font-condensed text-2xl font-bold uppercase tracking-wider text-brand-txt leading-none">
          Driver Lineup
        </h1>
      </div>

      <div>
        <label className={labelCls}>Enter the driver names</label>
        <div className="bg-brand-bg3 border border-brand-border rounded-lg px-3">
          {drivers.map((item, i) => (
            <DriverRow
              key={item.id}
              item={item}
              index={i}
              onChange={handleNameChange}
            />
          ))}
        </div>
        <p className="font-mono text-[10px] text-brand-txt3 mt-1.5">
          Starting sequence can be set from the dashboard
        </p>
      </div>

      {submitError && (
        <div role="alert" className="alert alert-error py-2 text-xs font-mono">
          {submitError}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn btn-primary w-full min-h-[52px] mt-1"
      >
        {isSubmitting ? 'Creating…' : 'Create Event'}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="btn btn-ghost border border-brand-border2 text-brand-txt2 w-full hover:border-brand-yellow/40 hover:text-brand-txt"
      >
        Back
      </button>
    </div>
  )
}

const defaultStep1: Step1Data = {
  name: '',
  location: '',
  raceDate: '',
  startTime: '',
  durationHours: '',
  durationMinutes: '',
  numDrivers: '',
  totalSwapsTarget: '',
  maxStintTimeMinutes: '',
}

function makeDriverItems(count: number): DriverItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `driver-${i}`,
    name: '',
  }))
}

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<Step1Data>(defaultStep1)
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function goToStep2() {
    const count = Math.min(20, Math.max(1, Number(step1.numDrivers) || 1))
    if (drivers.length !== count) {
      setDrivers(makeDriverItems(count))
    }
    setStep(2)
  }

  async function handleSubmit() {
    const anyBlank = drivers.some((d) => !d.name.trim())
    if (anyBlank) {
      setSubmitError('Please enter a name for every driver.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const result = await createEvent({
        name: step1.name.trim(),
        location: step1.location.trim(),
        raceDate: step1.raceDate,
        startTime: step1.startTime,
        totalDurationHours: Number(step1.durationHours) || 0,
        totalDurationMinutes: Number(step1.durationMinutes) || 0,
        numDrivers: Number(step1.numDrivers),
        totalSwapsTarget: step1.totalSwapsTarget ? Number(step1.totalSwapsTarget) : null,
        maxStintTimeMinutes: step1.maxStintTimeMinutes
          ? Number(step1.maxStintTimeMinutes)
          : null,
        drivers: drivers.map((d, i) => ({ name: d.name.trim(), sequenceOrder: i + 1 })),
      })

      if ('error' in result) {
        setSubmitError(result.error)
        setIsSubmitting(false)
        return
      }

      setHostSession(result.eventId)

      try {
        localStorage.setItem(
          'bbx_pending_summary',
          JSON.stringify({
            name: step1.name.trim(),
            location: step1.location.trim(),
            raceDate: step1.raceDate,
            durationHours: Number(step1.durationHours) || 0,
            durationMinutes: Number(step1.durationMinutes) || 0,
            numDrivers: Number(step1.numDrivers),
          })
        )
      } catch {
        // ignore
      }

      router.push(
        `/create/success?eventId=${encodeURIComponent(result.eventId)}&code=${encodeURIComponent(result.accessCode)}`
      )
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-brand-bg text-brand-txt flex flex-col">
      <AppNavBar />

      {/* Step progress bar */}
      <div className="h-0.5 bg-brand-border">
        <div
          className="h-full bg-brand-yellow transition-all duration-300"
          style={{ width: step === 1 ? '50%' : '100%' }}
        /></div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-4">
        <div className="max-w-sm mx-auto w-full">
          {step === 1 ? (
            <StepRaceDetails data={step1} onChange={setStep1} onNext={goToStep2} />
          ) : (
            <StepDrivers
              numDrivers={Number(step1.numDrivers)}
              drivers={drivers}
              onDriversChange={setDrivers}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </div>
    </main>
  )
}
