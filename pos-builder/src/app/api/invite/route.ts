import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create user directly with password
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Update store_members with user_id and name
  await supabase
    .from('store_members')
    .update({ user_id: data.user.id, status: 'active', name })
    .eq('invited_email', email)

  return NextResponse.json({ success: true })
}