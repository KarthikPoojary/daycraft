export interface Trip {
  id: string
  user_id: string
  destination: string
  hotel_name: string | null
  check_in: string
  check_out: string
  preferences: string | null
  created_at: string
  suggestions: SuggestionsResponse | null
}

export type SuggestionType = 'activity' | 'restaurant' | 'tip'

export interface Suggestion {
  type: SuggestionType
  name: string
  description: string
  timing: string
  location: string
  price_range: string
  why: string
  duration: string
  travel_time: string
}

export interface SuggestionsResponse {
  overview: string
  suggestions: Suggestion[]
}
