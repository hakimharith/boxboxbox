import Link from 'next/link'
import { Plus, DoorOpen } from 'lucide-react'
import AppNavBar from '@/components/AppNavBar'

export default function HomePage() {
  return (
    <main className="min-h-dvh race-bg text-brand-txt flex flex-col">
      <AppNavBar />

      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 pb-8">
        <div className="w-full max-w-sm flex flex-col gap-4">

          {/* Title block */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-yellow bbx-chevron flex-shrink-0" />
              <div>
                <div className="font-display text-4xl font-bold tracking-[0.08em] text-brand-txt uppercase leading-none">
                  BOXBOXBOX
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-txt3 mt-1.5">
                  Endurance Race Tracker
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Link
            href="/create"
            className="btn btn-primary w-full min-h-[52px] gap-2"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            Create New Event
          </Link>

          <Link
            href="/join"
            className="btn btn-ghost border border-brand-border2 text-brand-txt2 w-full min-h-[52px] hover:border-brand-yellow/40 hover:text-brand-txt gap-2"
          >
            <DoorOpen size={14} aria-hidden="true" />
            Join With Access Code
          </Link>
        </div>
      </div>
    </main>
  )
}
