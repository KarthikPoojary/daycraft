'use client'

import { useState } from 'react'
import type { Suggestion, SuggestionsResponse, ItinerarySave } from '@/lib/types'
import Itinerary from './Itinerary'

const TYPE_CONFIG = {
  activity:   { label: 'Activity',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '🗺️' },
  restaurant: { label: 'Restaurant', bg: 'bg-amber-50',  text: 'text-amber-700',  icon: '🍽️' },
  tip:        { label: 'Tip',        bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '💡' },
}

export default function SuggestionCards({
  data,
  destination,
  hotelName,
  tripId,
  savedItinerary,
}: {
  data: SuggestionsResponse
  destination: string
  hotelName?: string
  tripId?: string | null
  savedItinerary?: ItinerarySave | null
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set())

  function toggle(name: string) {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const activities  = data.suggestions.filter((s) => s.type === 'activity')
  const restaurants = data.suggestions.filter((s) => s.type === 'restaurant')
  const tips        = data.suggestions.filter((s) => s.type === 'tip')
  const savedItems  = data.suggestions.filter((s) => s.type !== 'tip' && saved.has(s.name))

  return (
    <div className="space-y-6 mt-2">
      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300 mb-1">Your guide to</p>
        <h2 className="text-xl font-bold mb-2">{destination}</h2>
        <p className="text-sm text-indigo-100 leading-relaxed">{data.overview}</p>
      </div>

      {activities.length  > 0 && <Section title="Things to do"  suggestions={activities}  saved={saved} onToggle={toggle} />}
      {restaurants.length > 0 && <Section title="Where to eat"  suggestions={restaurants} saved={saved} onToggle={toggle} />}
      {tips.length        > 0 && <Section title="Local tips"    suggestions={tips}        saved={saved} onToggle={toggle} />}

      {savedItems.length > 0 && (
        <Itinerary
          stops={savedItems}
          hotelName={hotelName || 'Your hotel'}
          destination={destination}
          defaultStartMinutes={9 * 60}
          tripId={tripId}
          initialItinerary={savedItinerary}
        />
      )}
    </div>
  )
}

function Section({
  title, suggestions, saved, onToggle,
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
  suggestion: s, saved, onToggle,
}: {
  suggestion: Suggestion
  saved: boolean
  onToggle: (name: string) => void
}) {
  const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.activity
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${saved ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">{cfg.icon}</span>
          <h4 className="font-semibold text-gray-900 text-sm truncate">{s.name}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.price_range && <span className="text-xs text-gray-400 font-medium">{s.price_range}</span>}
          {s.type !== 'tip' && (
            <button
              onClick={() => onToggle(s.name)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                saved ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-400'
              }`}
              title={saved ? 'Remove from itinerary' : 'Add to itinerary'}
            >
              {saved && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {s.location  && <Chip>📍 {s.location}</Chip>}
        {s.timing    && <Chip>🕐 {s.timing}</Chip>}
        {s.duration  && <Chip>⏱ {s.duration}</Chip>}
        {s.why && (
          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
            {s.why}
          </span>
        )}
      </div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {children}
    </span>
  )
}
