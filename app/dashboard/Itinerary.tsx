'use client'

// Itinerary.tsx — interactive day-planner timeline for Daycraft
// Drop-in replacement for the timeline section of SuggestionCards.
// Stack: Next.js 16 App Router · React 19 · Tailwind CSS 4
//
// Usage:
//   import Itinerary from './Itinerary'
//   <Itinerary
//     stops={savedItems}             // Suggestion[] (type, name, location, duration, travel_time)
//     hotelName="Le Marais Hotel"
//     destination="Paris"
//     date="Mon, Apr 13"
//     defaultStartMinutes={9 * 60}
//   />

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Suggestion, SuggestionType } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stop {
  id: string
  type: SuggestionType
  name: string
  location: string
  durationMins: number
  travelMins: number
}

interface ItineraryProps {
  stops: Suggestion[]
  hotelName?: string
  destination?: string
  date?: string
  defaultStartMinutes?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDuration(str?: string | null): number {
  if (!str) return 0
  let m = 0
  const s = String(str).toLowerCase().replace(/–|—/g, '-')
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/)
  const min = s.match(/(\d+)\s*m(?:in)?\b/)
  if (h) m += Math.round(parseFloat(h[1]) * 60)
  if (min) m += parseInt(min[1], 10)
  if (!h && !min) {
    const just = s.match(/^(\d+)$/)
    if (just) m = parseInt(just[1], 10)
  }
  return m
}

function formatDuration(mins: number): string {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function formatTime(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  const period = h >= 12 ? 'pm' : 'am'
  let h12 = h % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${m.toString().padStart(2, '0')}${period}`
}

function formatTimeShort(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  const period = h >= 12 ? 'p' : 'a'
  let h12 = h % 12
  if (h12 === 0) h12 = 12
  return m === 0 ? `${h12}${period}` : `${h12}:${m.toString().padStart(2, '0')}${period}`
}

// ─── Type system ─────────────────────────────────────────────────────────────
const TYPE_STYLE: Record<SuggestionType, { dot: string; soft: string; text: string; label: string }> = {
  activity:   { dot: '#2563eb', soft: '#eff6ff', text: '#1d4ed8', label: 'Activity' },
  restaurant: { dot: '#d97706', soft: '#fffbeb', text: '#b45309', label: 'Restaurant' },
  tip:        { dot: '#059669', soft: '#ecfdf5', text: '#047857', label: 'Tip' },
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function TypeIcon({ type, className = 'w-4 h-4' }: { type: SuggestionType; className?: string }) {
  if (type === 'restaurant') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 3v8a2 2 0 0 0 2 2v8M9 3v8a2 2 0 0 1-2 2"/>
        <path d="M15 13V3c2 0 3 1.5 3 4v6h-3zm0 0v8"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  )
}

function HotelIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-7h6v7"/><path d="M3 21h18"/>
    </svg>
  )
}

function CarIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 17h14M5 17v-4l2-5h10l2 5v4M5 17v2M19 17v2"/>
      <circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>
    </svg>
  )
}

function GripIcon({ className = 'w-3.5 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 16" fill="currentColor" className={className}>
      <circle cx="4" cy="3" r="1.3"/><circle cx="10" cy="3" r="1.3"/>
      <circle cx="4" cy="8" r="1.3"/><circle cx="10" cy="8" r="1.3"/>
      <circle cx="4" cy="13" r="1.3"/><circle cx="10" cy="13" r="1.3"/>
    </svg>
  )
}

function ExternalIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 17 17 7M7 7h10v10"/>
    </svg>
  )
}

function PlayIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  )
}

// ─── Map thumb (decorative, deterministic by location) ───────────────────────
function MapThumb({ location, className = '' }: { location: string; className?: string }) {
  const seed = useMemo(() => {
    let h = 0
    for (let i = 0; i < (location || '').length; i++) h = (h * 31 + location.charCodeAt(i)) | 0
    return Math.abs(h)
  }, [location])
  const px = 30 + (seed % 40)
  const py = 30 + ((seed >> 5) % 40)
  const rot = ((seed >> 10) % 30) - 15

  return (
    <div className={`relative overflow-hidden bg-[#eef1ec] ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ transform: `rotate(${rot}deg) scale(1.4)` }}>
        <g stroke="#d6dccd" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M-10 25 L 110 35"/><path d="M-10 70 L 110 60"/>
          <path d="M30 -10 L 25 110"/><path d="M75 -10 L 80 110"/>
        </g>
        <g stroke="#e5ead8" strokeWidth="1" strokeLinecap="round" fill="none">
          <path d="M-10 50 L 110 48"/><path d="M55 -10 L 53 110"/>
        </g>
        <rect x="35" y="40" width="35" height="22" fill="#dde7c8" rx="2"/>
        <rect x="80" y="65" width="18" height="22" fill="#dde7c8" rx="2"/>
        <path d="M-10 85 Q 30 90 60 86 T 110 88 L 110 110 L -10 110 Z" fill="#d4e3ea"/>
      </svg>
      <div className="absolute" style={{ left: `${px}%`, top: `${py}%`, transform: 'translate(-50%, -100%)' }}>
        <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white shadow-sm"/>
        <div className="w-px h-1 bg-rose-500/60 mx-auto"/>
      </div>
    </div>
  )
}

// ─── Day total card ──────────────────────────────────────────────────────────
function DayTotal({ totalMins, endMins, stopCount, travelMins, activityMins }: {
  totalMins: number; endMins: number; stopCount: number; travelMins: number; activityMins: number
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-baseline justify-between gap-2 mb-2.5 sm:mb-3">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Day total</div>
          <div className="text-2xl sm:text-4xl text-stone-900 tracking-tight tabular-nums leading-none mt-1 font-semibold">
            {formatDuration(totalMins)}
          </div>
        </div>
        <div className="text-right min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Wraps at</div>
          <div className="text-xl sm:text-3xl text-stone-900 tracking-tight tabular-nums leading-none mt-1 font-semibold">
            {formatTime(endMins)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-stone-500">
        <span><span className="text-stone-700 font-medium tabular-nums">{stopCount}</span> stop{stopCount !== 1 ? 's' : ''}</span>
        <span className="w-1 h-1 rounded-full bg-stone-300"/>
        <span><span className="text-stone-700 font-medium tabular-nums">{formatDuration(activityMins)}</span> on site</span>
        <span className="w-1 h-1 rounded-full bg-stone-300"/>
        <span><span className="text-stone-700 font-medium tabular-nums">{formatDuration(travelMins)}</span> in transit</span>
      </div>
    </div>
  )
}

// ─── Time-of-day scrubber ────────────────────────────────────────────────────
type Block =
  | { kind: 'travel'; startMins: number; durationMins: number }
  | { kind: 'stop'; stopIdx: number; name: string; type: SuggestionType; startMins: number; durationMins: number }

function TimeScrubber({ blocks, startMins, endMins, onJump, focusIdx }: {
  blocks: Block[]; startMins: number; endMins: number; onJump: (i: number) => void; focusIdx: number | null
}) {
  const axisStart = Math.floor(startMins / 60) * 60
  const axisEnd = Math.ceil(endMins / 60) * 60
  const axisSpan = Math.max(60, axisEnd - axisStart)
  const ticks: number[] = []
  for (let t = axisStart; t <= axisEnd; t += 60) ticks.push(t)

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Day at a glance</div>
        <div className="text-[10px] sm:text-[11px] tabular-nums text-stone-500">
          {formatTimeShort(startMins)} <span className="text-stone-300 mx-1">→</span> {formatTimeShort(endMins)}
        </div>
      </div>
      <div className="relative h-11 rounded-xl bg-stone-50 ring-1 ring-stone-100 overflow-hidden">
        {blocks.map((b, i) => {
          const left = ((b.startMins - axisStart) / axisSpan) * 100
          const width = (b.durationMins / axisSpan) * 100
          if (b.kind === 'travel') {
            return (
              <div
                key={`t-${i}`}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${left}%`, width: `${width}%`,
                  background: 'repeating-linear-gradient(135deg, #e7e5e4 0 4px, transparent 4px 7px)',
                }}
                title={`Travel · ${formatDuration(b.durationMins)}`}
              />
            )
          }
          const isFocus = focusIdx === b.stopIdx
          return (
            <button
              key={`s-${i}`}
              onClick={() => onJump(b.stopIdx)}
              className={`absolute top-1.5 bottom-1.5 rounded-md transition-all hover:brightness-110 ${isFocus ? 'ring-2 ring-stone-900 ring-offset-1' : ''}`}
              style={{ left: `${left}%`, width: `${width}%`, background: TYPE_STYLE[b.type].dot }}
              title={`${b.name} · ${formatDuration(b.durationMins)}`}
            >
              <span className="sr-only">{b.name}</span>
            </button>
          )
        })}
      </div>
      <div className="relative mt-1.5 h-3 text-[10px] tabular-nums text-stone-400">
        {ticks.map((t, i) => {
          const left = ((t - axisStart) / axisSpan) * 100
          return (
            <span
              key={t}
              className="absolute top-0"
              style={{
                left: `${left}%`,
                transform: i === 0 ? 'translateX(0)' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {formatTimeShort(t)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Editable on-site duration ───────────────────────────────────────────────
function DurationEditor({ minutes, onChange }: { minutes: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const presets = [30, 45, 60, 90, 120, 180]
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-xs font-medium tabular-nums border transition-colors ${
          open
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-white'
        }`}
        title="Edit time on site"
      >
        <PlayIcon className="w-3 h-3 opacity-60"/>
        <span>{formatDuration(minutes)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-[200px] rounded-xl border border-stone-200 bg-white shadow-lg p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1.5 px-1">Time on site</div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => { onChange(p); setOpen(false) }}
                className={`text-xs tabular-nums py-1.5 rounded-md border transition-colors ${
                  p === minutes
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                {formatDuration(p)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <input
              type="range" min={15} max={300} step={15}
              value={minutes}
              onChange={(e) => onChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-stone-900"
            />
            <span className="text-xs tabular-nums text-stone-700 w-12 text-right">{formatDuration(minutes)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stop card ───────────────────────────────────────────────────────────────
function StopCard({
  stop, index, total, arrival, leave, isDragging, isOver,
  onDurationChange, onPickup, onMove, isFocus, onFocus,
}: {
  stop: Stop
  index: number
  total: number
  arrival: number
  leave: number
  isDragging: boolean
  isOver: boolean
  onDurationChange: (i: number, v: number) => void
  onPickup: (i: number) => void
  onMove: (i: number, delta: number) => void
  isFocus: boolean
  onFocus: (i: number) => void
}) {
  const cfg = TYPE_STYLE[stop.type] ?? TYPE_STYLE.activity
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onTouchStart() {
    longPressTimer.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
      onPickup(index)
    }, 350)
  }
  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <article
      onClick={() => onFocus(index)}
      className={`group relative rounded-2xl border bg-white transition-all duration-200 cursor-pointer ${
        isFocus ? 'border-stone-900 shadow-[0_4px_20px_rgba(15,23,42,0.08)]' :
        isDragging ? 'border-stone-300 opacity-50' :
        isOver ? 'border-stone-900 shadow-[0_4px_20px_rgba(15,23,42,0.06)]' :
        'border-stone-200 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:border-stone-300'
      }`}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
        style={{ background: cfg.dot }}
        aria-hidden
      />

      <div className="flex items-stretch gap-2.5 sm:gap-3 p-2.5 sm:p-4">
        <button
          onMouseDown={(e) => { e.stopPropagation(); onPickup(index) }}
          onTouchStart={onTouchStart}
          onTouchEnd={clearLongPress}
          onTouchCancel={clearLongPress}
          onTouchMove={clearLongPress}
          className="hidden sm:flex shrink-0 w-5 cursor-grab active:cursor-grabbing items-center justify-center text-stone-300 hover:text-stone-500 transition-colors"
          aria-label="Drag to reorder"
        >
          <GripIcon className="w-3.5 h-4"/>
        </button>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location || stop.name)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden ring-1 ring-stone-200 hover:ring-stone-400 transition-shadow group/map"
          title="Open in Google Maps"
        >
          <MapThumb location={stop.location || stop.name} className="w-full h-full"/>
          <div className="absolute inset-0 bg-stone-900/0 group-hover/map:bg-stone-900/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover/map:opacity-100 transition-opacity bg-white/95 rounded-full p-1 shadow">
              <ExternalIcon className="w-3 h-3 text-stone-700"/>
            </div>
          </div>
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: cfg.soft, color: cfg.text }}
              >
                <TypeIcon type={stop.type} className="w-2.5 h-2.5"/>
                <span>{cfg.label}</span>
              </span>
              <span className="text-[11px] text-stone-400 tabular-nums">#{index + 1}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DurationEditor minutes={stop.durationMins} onChange={(v) => onDurationChange(index, v)}/>
            </div>
          </div>

          <h3 className="text-[14px] sm:text-base font-semibold text-stone-900 leading-tight truncate">
            {stop.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] sm:text-xs text-stone-500 truncate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3 shrink-0">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>
            </svg>
            <span className="truncate">{stop.location}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[10.5px] sm:text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 text-stone-500">
              <span className="text-stone-400">Arrive</span>
              <span className="font-medium text-stone-800">{formatTime(arrival)}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-stone-300"/>
            <span className="inline-flex items-center gap-1 text-stone-500">
              <span className="text-stone-400">Leave</span>
              <span className="font-medium text-stone-800">{formatTime(leave)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="sm:hidden flex items-center justify-between border-t border-stone-100 px-3 py-1.5 text-[11px] text-stone-400">
        <button
          onClick={(e) => { e.stopPropagation(); onMove(index, -1) }}
          disabled={index === 0}
          className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-stone-50 active:bg-stone-100 text-stone-600 inline-flex items-center gap-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3"><path d="m18 15-6-6-6 6"/></svg>
          Up
        </button>
        <span className="tabular-nums">Hold to drag</span>
        <button
          onClick={(e) => { e.stopPropagation(); onMove(index, 1) }}
          disabled={index === total - 1}
          className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-stone-50 active:bg-stone-100 text-stone-600 inline-flex items-center gap-1"
        >
          Down
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </article>
  )
}

function TravelLeg({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2 my-1 ml-2 sm:ml-8 pl-1 sm:pl-2">
      <div className="w-px h-2 bg-stone-200"/>
      <div className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-stone-500 px-2 py-0.5 rounded-full bg-stone-50 border border-stone-200/70 tabular-nums">
        <CarIcon className="w-3 h-3"/>
        <span>{formatDuration(minutes)}</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent"/>
    </div>
  )
}

function HotelRow({ name, label, time, isStart, onEditStart }: {
  name: string; label: string; time: string; isStart?: boolean; onEditStart?: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 px-1 sm:px-2 py-2.5">
      <div className="shrink-0 sm:ml-8">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-900 text-white flex items-center justify-center">
          <HotelIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400">{label}</div>
        <div className="text-[13px] sm:text-sm font-semibold text-stone-900 truncate">{name}</div>
      </div>
      {isStart ? (
        <button
          onClick={onEditStart}
          className="text-xs tabular-nums px-2.5 py-1 rounded-lg border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-stone-700 transition-colors font-medium"
          title="Set leave time"
        >
          Leave {time}
        </button>
      ) : (
        <span className="text-xs tabular-nums px-2.5 py-1 text-stone-500">Back by {time}</span>
      )}
    </div>
  )
}

function StartTimePopover({ open, onClose, mins, onChange }: {
  open: boolean; onClose: () => void; mins: number; onChange: (m: number) => void
}) {
  if (!open) return null
  const presets = [7 * 60, 8 * 60, 9 * 60, 10 * 60, 11 * 60]
  return (
    <div className="fixed inset-0 z-30" onClick={onClose}>
      <div className="absolute inset-0 bg-stone-900/20"/>
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[280px] rounded-2xl bg-white border border-stone-200 shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-2">Leave hotel at</div>
        <div className="text-3xl tabular-nums text-stone-900 mb-3 font-semibold">{formatTime(mins)}</div>
        <input
          type="range" min={5 * 60} max={14 * 60} step={15}
          value={mins}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full accent-stone-900 mb-3"
        />
        <div className="grid grid-cols-5 gap-1 mb-3">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`text-[11px] tabular-nums py-1 rounded-md border ${
                p === mins
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              {formatTimeShort(p)}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800">
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function Itinerary({
  stops: incoming,
  hotelName = 'Your hotel',
  destination,
  date,
  defaultStartMinutes = 9 * 60,
}: ItineraryProps) {
  // Normalize Suggestion → Stop
  const initialStops: Stop[] = useMemo(
    () =>
      incoming.map((s, i) => ({
        id: `${i}-${s.name}`,
        type: s.type,
        name: s.name,
        location: s.location,
        durationMins: parseDuration(s.duration) || 60,
        travelMins: parseDuration(s.travel_time) || 15,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incoming.map((s) => s.name).join('|')]
  )

  const [stops, setStops] = useState<Stop[]>(initialStops)
  const [startMins, setStartMins] = useState(defaultStartMinutes)
  const [showStartEdit, setShowStartEdit] = useState(false)
  const [focusIdx, setFocusIdx] = useState<number | null>(null)

  // Sync if parent's saved set changes (add/remove)
  useEffect(() => {
    setStops((prev) => {
      const kept = prev.filter((p) => initialStops.some((i) => i.name === p.name))
      const added = initialStops.filter((i) => !prev.some((p) => p.name === i.name))
      return [...kept, ...added]
    })
  }, [initialStops])

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0, active: false })
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const schedule = useMemo(() => {
    const rows: { stopIdx: number; arrival: number; leave: number; travelIn: number }[] = []
    const blocks: Block[] = []
    let t = startMins
    let activityMins = 0
    let travelMins = 0
    stops.forEach((s, i) => {
      const tt = s.travelMins
      blocks.push({ kind: 'travel', startMins: t, durationMins: tt })
      t += tt
      travelMins += tt
      const arrival = t
      blocks.push({ kind: 'stop', stopIdx: i, name: s.name, type: s.type, startMins: t, durationMins: s.durationMins })
      t += s.durationMins
      activityMins += s.durationMins
      const leave = t
      rows.push({ stopIdx: i, arrival, leave, travelIn: tt })
    })
    const returnTravel = stops.length ? Math.max(15, stops[stops.length - 1].travelMins) : 0
    blocks.push({ kind: 'travel', startMins: t, durationMins: returnTravel })
    t += returnTravel
    travelMins += returnTravel
    return { rows, blocks, endMins: t, activityMins, travelMins }
  }, [stops, startMins])

  const totalMins = schedule.endMins - startMins

  const pickup = useCallback((i: number) => setDragIdx(i), [])

  useEffect(() => {
    if (dragIdx === null) return
    function onMove(e: MouseEvent | TouchEvent) {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY
      setPointer({ x, y, active: true })
      let foundIdx: number | null = null
      Object.entries(cardRefs.current).forEach(([k, el]) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (y >= r.top && y <= r.bottom) foundIdx = parseInt(k, 10)
      })
      if (foundIdx !== null) setOverIdx(foundIdx)
    }
    function onUp() {
      if (overIdx !== null && overIdx !== dragIdx) {
        setStops((prev) => {
          const next = [...prev]
          const [m] = next.splice(dragIdx as number, 1)
          next.splice(overIdx as number, 0, m)
          return next
        })
      }
      setDragIdx(null); setOverIdx(null); setPointer({ x: 0, y: 0, active: false })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove as EventListener, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove as EventListener)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragIdx, overIdx])

  function moveBy(i: number, delta: number) {
    setStops((prev) => {
      const j = i + delta
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      const [m] = next.splice(i, 1)
      next.splice(j, 0, m)
      return next
    })
  }
  function setDuration(i: number, v: number) {
    setStops((prev) => prev.map((s, k) => (k === i ? { ...s, durationMins: v } : s)))
  }

  if (stops.length === 0) return null

  return (
    <div className="text-stone-900 antialiased">
      {(destination || date) && (
        <div className="flex items-baseline justify-between mb-3 px-1">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Itinerary</div>
            <h2 className="text-2xl sm:text-3xl tracking-tight mt-0.5 font-semibold">
              {destination}
              {date ? <span className="text-stone-400 font-normal"> · {date}</span> : null}
            </h2>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        <DayTotal
          totalMins={totalMins}
          endMins={schedule.endMins}
          stopCount={stops.length}
          travelMins={schedule.travelMins}
          activityMins={schedule.activityMins}
        />
        <TimeScrubber
          blocks={schedule.blocks}
          startMins={startMins}
          endMins={schedule.endMins}
          onJump={setFocusIdx}
          focusIdx={focusIdx}
        />
      </div>

      <div className="relative rounded-2xl bg-stone-50/60 ring-1 ring-stone-200/70 p-1.5 sm:p-4">
        <div className="hidden sm:block absolute left-[44px] top-12 bottom-12 w-px bg-stone-200" aria-hidden/>

        <HotelRow
          name={hotelName}
          label="Start"
          time={formatTime(startMins)}
          isStart
          onEditStart={() => setShowStartEdit(true)}
        />

        {stops.map((s, i) => {
          const row = schedule.rows[i]
          return (
            <div key={s.id}>
              <TravelLeg minutes={s.travelMins}/>
              <div
                ref={(el) => { cardRefs.current[i] = el }}
                className={`relative ${dragIdx === i ? 'pointer-events-none' : ''}`}
              >
                <StopCard
                  stop={s}
                  index={i}
                  total={stops.length}
                  arrival={row.arrival}
                  leave={row.leave}
                  isDragging={dragIdx === i}
                  isOver={overIdx === i && dragIdx !== null && dragIdx !== i}
                  onDurationChange={setDuration}
                  onPickup={pickup}
                  onMove={moveBy}
                  isFocus={focusIdx === i}
                  onFocus={(idx) => setFocusIdx((cur) => (cur === idx ? null : idx))}
                />
                {overIdx === i && dragIdx !== null && dragIdx !== i && (
                  <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-stone-900"/>
                )}
              </div>
            </div>
          )
        })}

        <TravelLeg minutes={Math.max(15, stops[stops.length - 1].travelMins)}/>
        <HotelRow name={hotelName} label="Back to base" time={formatTime(schedule.endMins)}/>
      </div>

      {dragIdx !== null && pointer.active && stops[dragIdx] && (
        <div className="fixed z-40 pointer-events-none" style={{ left: pointer.x - 24, top: pointer.y - 24, width: 280 }}>
          <div className="rounded-2xl border border-stone-900 bg-white shadow-2xl p-3 -rotate-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-8 rounded" style={{ background: TYPE_STYLE[stops[dragIdx].type].dot }}/>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-stone-900 truncate">{stops[dragIdx].name}</div>
                <div className="text-xs text-stone-500 truncate">{stops[dragIdx].location}</div>
              </div>
              <GripIcon className="w-3.5 h-4 text-stone-400"/>
            </div>
          </div>
        </div>
      )}

      <StartTimePopover
        open={showStartEdit}
        onClose={() => setShowStartEdit(false)}
        mins={startMins}
        onChange={setStartMins}
      />
    </div>
  )
}
