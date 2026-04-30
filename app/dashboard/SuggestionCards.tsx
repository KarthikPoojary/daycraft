import type { Suggestion, SuggestionsResponse } from '@/lib/types'

const TYPE_CONFIG = {
  activity: { label: 'Activity', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🗺️' },
  restaurant: { label: 'Restaurant', bg: 'bg-amber-50', text: 'text-amber-700', icon: '🍽️' },
  tip: { label: 'Tip', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '💡' },
}

export default function SuggestionCards({
  data,
  destination,
}: {
  data: SuggestionsResponse
  destination: string
}) {
  const activities = data.suggestions.filter((s) => s.type === 'activity')
  const restaurants = data.suggestions.filter((s) => s.type === 'restaurant')
  const tips = data.suggestions.filter((s) => s.type === 'tip')

  return (
    <div className="space-y-6 mt-2">
      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300 mb-1">
          Your guide to
        </p>
        <h2 className="text-xl font-bold mb-2">{destination}</h2>
        <p className="text-sm text-indigo-100 leading-relaxed">{data.overview}</p>
      </div>

      {activities.length > 0 && <Section title="Things to do" suggestions={activities} />}
      {restaurants.length > 0 && <Section title="Where to eat" suggestions={restaurants} />}
      {tips.length > 0 && <Section title="Local tips" suggestions={tips} />}
    </div>
  )
}

function Section({ title, suggestions }: { title: string; suggestions: Suggestion[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <Card key={i} suggestion={s} />
        ))}
      </div>
    </div>
  )
}

function Card({ suggestion: s }: { suggestion: Suggestion }) {
  const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.activity

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{cfg.icon}</span>
          <h4 className="font-semibold text-gray-900 text-sm">{s.name}</h4>
        </div>
        {s.price_range && (
          <span className="text-xs text-gray-400 font-medium shrink-0">{s.price_range}</span>
        )}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {s.location && (
          <Chip>📍 {s.location}</Chip>
        )}
        {s.timing && (
          <Chip>🕐 {s.timing}</Chip>
        )}
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
