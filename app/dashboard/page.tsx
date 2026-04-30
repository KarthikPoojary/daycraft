import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TripForm from './TripForm'
import SignOutButton from './SignOutButton'
import type { Trip } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 font-bold text-lg">✈</span>
            <span className="font-bold text-gray-900">Daycraft</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-16">
        <TripForm trips={(trips ?? []) as Trip[]} />
      </main>
    </div>
  )
}
