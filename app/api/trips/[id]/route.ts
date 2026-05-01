import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('trips').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { error } = await supabase.from('trips').update(body).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })

  return NextResponse.json({ success: true })
}
