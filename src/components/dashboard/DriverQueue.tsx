'use client'

interface UpNextEntry {
  name: string
  isLoop: boolean
}

interface DriverQueueProps {
  nextDriver: string | null
  upNext: UpNextEntry[]
}

export default function DriverQueue({ nextDriver, upNext }: DriverQueueProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-2">
      {/* Next driver */}
      <div className="bg-brand-bg3 border border-brand-border border-l-[3px] border-l-brand-yellow rounded px-2 py-2.5">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1.5">
          Next driver
        </p>
        {nextDriver ? (
          <div className="font-condensed text-xl font-bold text-brand-txt dark:text-brand-yellow uppercase leading-none">
            {nextDriver}
          </div>
        ) : (
          <div className="font-condensed text-sm text-brand-txt3 uppercase">—</div>
        )}
      </div>

      {/* Up next */}
      <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-2.5">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1.5">
          Up next
        </p>
        <div className="flex flex-col gap-1">
          {upNext.length === 0 && (
            <span className="text-[10px] text-brand-txt3 font-mono">—</span>
          )}
          {upNext.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-[10px] font-mono border-b border-brand-border/50 pb-1 last:border-b-0 last:pb-0 ${
                i === 0 ? 'text-brand-txt2' : 'text-brand-txt3'
              }`}
            >
              <span className={`text-[8px] font-bold ${i === 0 ? 'text-brand-cyan' : 'text-brand-txt3'}`}>
                {String(i + 2).padStart(2, '0')}
              </span>
              <span className="truncate">{entry.name}</span>
              {entry.isLoop && <span className="text-brand-txt3 ml-auto">↺</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
