'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  eventName: string
  accessCode: string
}

export default function ShareButton({ eventName, accessCode }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/join?code=${encodeURIComponent(accessCode)}`
    const title = `BoxBoxBox · ${eventName}`
    const text = `Follow our endurance race live — enter code ${accessCode} or open: ${url}`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
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
      title="Share viewer link"
    >
      {copied ? (
        <>
          <Check size={10} className="text-brand-green flex-shrink-0" />
          <span className="text-brand-green">Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={10} className="flex-shrink-0" />
          {accessCode}
        </>
      )}
    </button>
  )
}
