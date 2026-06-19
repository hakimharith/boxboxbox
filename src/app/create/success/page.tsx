'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Share2 } from 'lucide-react'
import { setHostSession } from '@/types/app'
import AppNavBar from '@/components/AppNavBar'

interface EventSummary {
  name: string
  location: string
  raceDate: string
  durationHours: number
  durationMinutes: number
  numDrivers: number
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''
  const code = searchParams.get('code') ?? ''

  const [summary, setSummary] = useState<EventSummary | null>(null)

  useEffect(() => {
    if (eventId) {
      setHostSession(eventId)
    }
  }, [eventId])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bbx_pending_summary')
      if (raw) {
        setSummary(JSON.parse(raw))
        localStorage.removeItem('bbx_pending_summary')
      }
    } catch {
      // ignore
    }
  }, [])

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `BoxBoxBox · Race Event`,
          text: `Follow our endurance race live \u2014 enter code ${code} at boxboxbox.app/join`,
          url: `https://boxboxbox.app/join?code=${code}`,
        })
      } catch {
        // user cancelled or API not supported
      }
    }
  }

  if (!eventId || !code) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <p className="font-mono text-sm text-brand-txt3">Invalid session.</p>
        <Link href="/" className="text-brand-yellow text-sm mt-4 underline">
          Return home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-6">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-4">

        {/* Hero */}
        <div className="flex flex-col items-center pb-1">
          <div className="w-10 h-10 rounded-full bg-brand-green/20 border-2 border-brand-green/70 flex items-center justify-center mb-3">
            <Check size={18} className="text-brand-green" strokeWidth={3} />
          </div>
          <div className="font-condensed text-xl font-bold tracking-wider">BOXES IN!</div>
          <div className="font-mono text-xs text-brand-txt3 mt-1">
            Share this code with your team
          </div>
        </div>

        {/* Code box */}
        <div className="bg-brand-bg3 border border-brand-border2 rounded-lg p-4 text-center">
          <p className="text-xs uppercase font-mono font-bold text-brand-txt3 tracking-widest mb-2">
            Access code
          </p>
          <div className="font-mono text-3xl font-bold tracking-widest text-brand-txt mb-3">
            {code}
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="btn btn-ghost border border-brand-border2 text-brand-txt2 w-full btn-sm gap-1.5 hover:border-brand-border hover:text-brand-txt"
          >
            <Share2 size={12} />
            Share join link
          </button>
        </div>

        {/* Event summary card */}
        {summary && (
          <p className="font-mono text-[10px] text-brand-txt3 uppercase tracking-widest -mb-2">Event Details</p>
        )}
        {summary && (
          <div className="bg-brand-bg4 rounded p-3 font-mono text-xs text-brand-txt3">
            <div className="text-sm font-bold text-brand-txt mb-1">{summary.name}</div>
            <div className="uppercase tracking-wide">
              {[
                summary.location || null,
                summary.raceDate
                  ? new Date(summary.raceDate + 'T12:00:00')
                      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                      .toUpperCase()
                  : null,
                summary.durationHours || summary.durationMinutes
                  ? `${summary.durationHours}H${summary.durationMinutes > 0 ? summary.durationMinutes + 'M' : ''}`
                  : null,
                summary.numDrivers ? `${summary.numDrivers} DRIVERS` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        )}

        {/* Go to dashboard */}
        <Link
          href={`/event/${eventId}`}
          className="btn btn-primary w-full min-h-[52px]"
        >
          Go to dashboard &rarr;
        </Link>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className="min-h-dvh bg-brand-bg text-brand-txt flex flex-col">
      <AppNavBar />

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-xs text-brand-txt3">Loading…</span>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  )
}
