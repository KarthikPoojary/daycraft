import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination, hotel_name, check_in, check_out, preferences } = await request.json()

  if (!destination || !check_in || !check_out) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ user_id: user.id, destination, hotel_name, check_in, check_out, preferences })
    .select()
    .single()

  if (tripError) {
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 })
  }

  const prompt = `You are an expert local travel advisor. Give current, accurate recommendations for someone visiting ${destination}.

Trip details:
- Destination: ${destination}
- Hotel / area: ${hotel_name || 'not specified'}
- Dates: ${check_in} to ${check_out}
- Preferences: ${preferences || 'no specific preferences'}

Return ONLY a valid JSON object — no markdown fences, no extra text — with this exact structure:
{
  "overview": "2-3 sentence description of the destination and what makes it special right now",
  "suggestions": [
    {
      "type": "activity",
      "name": "Place or attraction name",
      "description": "2-3 sentences about why it's worth visiting",
      "timing": "Best time to go (e.g. Morning, Evening, Full Day, Weekdays)",
      "location": "Neighborhood or street",
      "price_range": "Free | $ | $$ | $$$",
      "why": "One short phrase on why it fits their preferences"
    }
  ]
}

Use type "activity" for sights/experiences, "restaurant" for food/drink, "tip" for local insider advice.
Include 3-4 activities, 2-3 restaurants, 2-3 tips. Tailor everything to the stated preferences.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const suggestions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ trip, suggestions })
  } catch (err) {
    console.error('Suggestions error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
