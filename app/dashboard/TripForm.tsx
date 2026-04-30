'use client'

import { useState, useEffect } from 'react'
import type { Trip, SuggestionsResponse } from '@/lib/types'
import SuggestionCards from './SuggestionCards'

export default function TripForm({ trips }: { trips: Trip[] }) {
  const [destination, setDestination] = useState('')
  const [hotel, setHotel] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [activeDestination, setActiveDestination] = useState('')
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuggestions(null)
    setActiveDestination(destination)

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          hotel_name: hotel,
          check_in: checkIn,
          check_out: checkOut,
          preferences,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSuggestions(data.suggestions)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  function loadPreviousTrip(trip: Trip) {
    setDestination(trip.destination)
    setHotel(trip.hotel_name ?? '')
    setCheckIn(trip.check_in)
    setCheckOut(trip.check_out)
    setPreferences(trip.preferences ?? '')
    setSuggestions(null)
    setError('')
  }



  return (
    <div className="space-y-5">
      {trips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Recent trips
          </p>
          <div className="flex gap-2 flex-wrap">
            {trips.slice(0, 5).map((trip) => (
              <button
                key={trip.id}
                onClick={() => loadPreviousTrip(trip)}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                {trip.destination}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Plan your trip</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Destination <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="Paris, France"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Hotel / area</label>
            <input
              type="text"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="Hotel name or neighborhood (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Check-in <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Check-out <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferences</label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
              placeholder="Budget level, interests (art, food, hiking), dietary restrictions, mobility needs…"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Finding the best suggestions…' : 'Get suggestions'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-indigo-200 rounded-full" />
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-sm text-gray-500">Searching for the best spots in {activeDestination}…</p>
        </div>
      )}

      {suggestions && !loading && (
        <SuggestionCards data={suggestions} destination={activeDestination} />
      )}
    </div>
  )
}
