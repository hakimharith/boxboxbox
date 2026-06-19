'use client'

import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { Sun, Moon, ChevronLeft } from 'lucide-react'

export interface NavSection {
  id: string
  label: string
}

interface AppNavBarProps {
  backHref?: string
  backLabel?: string
  centerSlot?: React.ReactNode
  sections?: NavSection[]
  activeSection?: string
}

export default function AppNavBar({
  backHref,
  backLabel = 'Back',
  centerSlot,
  sections,
  activeSection,
}: AppNavBarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="sticky top-0 z-40">
      {/* ── Main bar ───────────────────────────────────────────── */}
      <div className="navbar min-h-[48px] h-[48px] px-3 bg-brand-bg2 border-b border-brand-border gap-2">
        {/* Logo */}
        <div className="navbar-start gap-2 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 group"
            aria-label="BoxBoxBox home"
          >
            <div className="relative w-6 h-6 flex-shrink-0">
              <div className="absolute inset-0 bg-brand-yellow" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30% 100%, 0 60%)' }} />
            </div>
            <span className="font-display text-[11px] font-bold tracking-[0.2em] text-brand-txt uppercase group-hover:text-brand-yellow transition-colors duration-150">
              BBX
            </span>
          </Link>

          <div className="w-px h-4 bg-brand-border flex-shrink-0" />

          <Link
            href="/"
            className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand-txt hover:text-brand-yellow transition-colors flex-shrink-0"
          >
            Home
          </Link>

          {backHref && backHref !== '/' && (
            <Link
              href={backHref}
              className="flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-wide text-brand-txt3 hover:text-brand-txt transition-colors flex-shrink-0"
            >
              <ChevronLeft size={11} strokeWidth={2.5} aria-hidden="true" />
              {backLabel}
            </Link>
          )}
        </div>

        {/* Center slot */}
        <div className="navbar-center flex-1 min-w-0 flex items-center gap-2 justify-start">
          {centerSlot}
        </div>

        {/* Theme toggle */}
        <div className="navbar-end flex-shrink-0">
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="btn btn-ghost btn-sm w-8 h-8 min-h-0 p-0 text-brand-txt3 hover:text-brand-txt"
          >
            {theme === 'dark'
              ? <Sun size={14} aria-hidden="true" />
              : <Moon size={14} aria-hidden="true" />
            }
          </button>
        </div>
      </div>

      {/* ── Section tab bar ────────────────────────────────────── */}
      {sections && sections.length > 0 && (
        <div className="flex bg-brand-bg2 border-b border-brand-border overflow-x-auto no-scrollbar">
          {sections.map((section) => {
            const isActive = activeSection === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={[
                  'flex-1 min-w-[64px] flex items-center justify-center py-2 text-[9px] font-mono font-bold uppercase tracking-widest transition-all duration-150 border-b-2 whitespace-nowrap',
                  isActive
                    ? 'text-brand-yellow border-brand-yellow'
                    : 'text-brand-txt3 border-transparent hover:text-brand-txt hover:border-brand-border2',
                ].join(' ')}
              >
                {section.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
