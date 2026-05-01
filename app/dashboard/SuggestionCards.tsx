'use client'

import { useState, useRef } from 'react'
import type { Suggestion, SuggestionsResponse } from '@/lib/types'

const TYPE_CONFIG = {
  activity: { label: 'Activity', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🗺️' },
  restaurant: { label: 'Restaurant', bg: 'bg-amber-50', text: 'text-amber-700', icon: '🍽️' },
  tip: { label: 'Tip', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '💡' },
}

export default function SuggestionCards({
  data,
  destination,
  hotelName,
}: {
  data: SuggestionsResponse
  destination: string
  hotelName?: string
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set())

  function toggle(name: string) {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const activities = data.suggestions.filter((s) => s.type === 'activity')
  const restaurants = data.suggestions.filter((s) => s.type === 'restaurant')
  const tips = data.suggestions.filter((s) => s.type === 'tip')

  const savedItems = data.suggestions.filter(
    (s) => s.type !== 'tip' && saved.has(s.name)
  )

  return (
    <div className="space-y-6 mt-2">
      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300 mb-1">
          Your guide to
        </p>
        <h2 className="text-xl font-bold mb-2">{destination}</h2>
        <p className="text-sm text-indigo-100 leading-relaxed">{data.overview}</p>
      </div>

      {activities.length > 0 && (
        <Section title="Things to do" suggestions={activities} saved={saved} onToggle={toggle} />
      )}
      {restaurants.length > 0 && (
        <Section title="Where to eat" suggestions={restaurants} saved={saved} onToggle={toggle} />
      )}
      {tips.length > 0 && (
        <Section title="Local tips" suggestions={tips} saved={saved} onToggle={toggle} />
      )}

      {savedItems.length > 0 && (
        <Timeline initialItems={savedItems} hotelName={hotelName || 'Your hotel'} />
      )}
    </div>
  )
}

function Section({
  title,
  suggestions,
  saved,
  onToggle,
}: {
  title: string
  suggestions: Suggestion[]
  saved: Set<string>
  onToggle: (name: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <Card key={i} suggestion={s} saved={saved.has(s.name)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

function Card({
  suggestion: s,
  saved,
  onToggle,
}: {
  suggestion: Suggestion
  saved: boolean
  onToggle: (name: string) => void
}) {
  const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.activity

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${
        saved ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">{cfg.icon}</span>
          <h4 className="font-semibold text-gray-900 text-sm truncate">{s.name}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.price_range && (
            <span className="text-xs text-gray-400 font-medium">{s.price_range}</span>
          )}
          {s.type !== 'tip' && (
            <button
              onClick={() => onToggle(s.name)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                saved
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
              title={saved ? 'Remove from itinerary' : 'Add to itinerary'}
            >
              {saved && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {s.location && <Chip>📍 {s.location}</Chip>}
        {s.timing && <Chip>🕐 {s.timing}</Chip>}
        {s.duration && <Chip>⏱ {s.duration}</Chip>}
        {s.why && (
          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
            {s.why}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

interface TimelineItem extends Suggestion {
  customDuration?: string
}

function Timeline({ initialItems, hotelName }: { initialItems: Suggestion[]; hotelName: string }) {
  const [items, setItems] = useState<TimelineItem[]>(initialItems)
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Sync when parent adds/removes items
  const itemNames = initialItems.map(i => i.name).join(',')
  const prevNames = useRef(itemNames)
  if (prevNames.current !== itemNames) {
    prevNames.current = itemNames
    setItems(prev => {
      const kept = prev.filter(p => initialItems.some(i => i.name === p.name))
      const added = initialItems.filter(i => !prev.some(p => p.name === i.name))
      return [...kept, ...added]
    })
  }

  function onDragStart(i: number) { dragIndex.current = i }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setDragOver(i)
  }
  function onDrop(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) { setDragOver(null); return }
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    setItems(next)
    dragIndex.current = null
    setDragOver(null)
  }

  function updateDuration(index: number, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, customDuration: value } : item))
  }

  const fromLabel = (index: number) =>
    index === 0 ? hotelName : items[index - 1].name

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span>🗓</span> Your itinerary
        </h3>
        <span className="text-xs text-gray-400">{items.length} stop{items.length !== 1 ? 's' : ''} · drag to reorder</span>
      </div>

      <div className="relative">
        {/* Hotel start */}
        <TimelineRow icon="🏨" label={hotelName} sublabel="Starting point" />

        {items.map((item, i) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.activity
          const isDraggingOver = dragOver === i
          return (
            <div key={item.name}>
              {/* Travel connector — from previous stop */}
              <TravelConnector travelTime={item.travel_time} fromLabel={fromLabel(i)} />

              {/* Draggable stop */}
              <div
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={() => setDragOver(null)}
                className={`flex items-start gap-3 cursor-grab active:cursor-grabbing rounded-xl p-2 -mx-2 transition-all ${
                  isDraggingOver ? 'bg-indigo-50 scale-[1.01]' : 'hover:bg-gray-50'
                }`}
              >
                {/* Drag handle */}
                <div className="pt-2 text-gray-300 hover:text-gray-400 shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
                    <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
                    <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
                    <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
                  </svg>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${cfg.bg}`}>
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate">{item.location}</p>
                </div>

                {/* Editable duration */}
                <DurationBadge
                  value={item.customDuration ?? item.duration ?? ''}
                  onChange={(v) => updateDuration(i, v)}
                />
              </div>
            </div>
          )
        })}

        {/* Return to hotel */}
        <TravelConnector fromLabel={items[items.length - 1]?.name} isDashed />
        <TimelineRow icon="🏨" label={hotelName} sublabel="End of day" />
      </div>
    </div>
  )
}

function TravelConnector({
  travelTime,
  fromLabel,
  isDashed,
}: {
  travelTime?: string
  fromLabel?: string
  isDashed?: boolean
}) {
  return (
    <div className="flex items-center gap-2 my-1 ml-12">
      <div className={`w-px h-5 ${isDashed ? 'border-l-2 border-dashed border-gray-200' : 'bg-gray-200'}`} />
      {(travelTime || isDashed) && (
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
          {isDashed ? '🏨 back to hotel' : `🚗 ${travelTime}${fromLabel ? ` from ${fromLabel}` : ''}`}
        </span>
      )}
    </div>
  )
}

function TimelineRow({
  icon,
  label,
  sublabel,
}: {
  icon: string
  label: string
  sublabel?: string
}) {
  return (
    <div className="flex items-start gap-3 px-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 bg-indigo-50">
        {icon}
      </div>
      <div className="pt-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
    </div>
  )
}

function DurationBadge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!value && !editing) return null

  if (editing) {
    return (
      <input
        autoFocus
        className="text-xs border border-indigo-300 rounded-full px-2 py-0.5 w-24 text-center outline-none focus:ring-1 focus:ring-indigo-400"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(draft); setEditing(false) } }}
      />
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-full px-2 py-0.5 shrink-0 transition-colors"
      title="Click to edit duration"
    >
      ⏱ {value}
    </button>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {children}
    </span>
  )
}
