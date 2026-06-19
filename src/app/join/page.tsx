'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DoorOpen } from 'lucide-react'
import { joinEvent } from './actions'
import AppNavBar from '@/components/AppNavBar'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const preCode = searchParams.get('code')
    if (preCode) setCode(preCode.toUpperCase())
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Please enter an access code.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await joinEvent(trimmed)
      if ('error' in result) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      router.push(`/event/${result.eventId}`)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Icon + title */}
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 rounded-full bg-brand-bg3 border border-brand-border2 flex items-center justify-center mb-1">
            <DoorOpen size={22} className="text-brand-txt2" />
          </div>
          <div className="font-condensed text-2xl font-bold tracking-wider uppercase">
            Join race
          </div>
          <div className="font-mono text-xs text-brand-txt3 text-center">
            Enter the access code shared by your race host
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs uppercase font-bold font-mono text-brand-txt3 mb-1 block">
              Access code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KRT-4X2Z"
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="input input-bordered w-full text-lg font-mono text-center tracking-widest uppercase"
            />
          </div>

          {error && (
            <div role="alert" className="alert alert-error py-2 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full min-h-[52px] gap-2"
          >
            {isLoading ? 'Joining…' : 'Join race'}
          </button>
        </form>

        <div className="border-t border-brand-border pt-3 text-center">
          <p className="font-mono text-xs text-brand-txt3">
            Don&apos;t have a code?{' '}
            <Link href="/create" className="text-brand-txt dark:text-brand-yellow underline hover:opacity-70 transition-opacity">
              Create an event
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
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
        <JoinContent />
      </Suspense>
    </main>
  )
}
