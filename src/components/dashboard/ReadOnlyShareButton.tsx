'use client'

import { useState } from 'react'
import { Link, Check } from 'lucide-react'

interface ReadOnlyShareButtonProps {
  eventId: string
}

export default function ReadOnlyShareButton({ eventId }: ReadOnlyShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/event/${eventId}/view`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Watch race live', url })
        return
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn btn-ghost btn-xs border border-brand-border2 font-mono text-[10px] tracking-widest normal-case text-brand-txt3 hover:text-brand-txt gap-1"
      title="Copy spectator view link"
    >
      {copied ? (
        <>
          <Check size={10} className="text-brand-green flex-shrink-0" />
          <span className="text-brand-green">Copied!</span>
        </>
      ) : (
        <>
          <Link size={10} className="flex-shrink-0" />
          Share Spectator View
        </>
      )}
    </button>
  )
}
