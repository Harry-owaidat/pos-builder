import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(request: Request) {
  const { user_id, member_id } = await request.json()
  const supabase = getAdmin()

  // 1. Delete from store_members
  const { error: memberError } = await supabase
    .from('store_members')
    .delete()
    .eq('id', member_id)

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  // 2. Delete from auth.users
  if (user_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const { user_id, member_id, name, email, password } = await request.json()
  const supabase = getAdmin()

  // Update store_members
  await supabase
    .from('store_members')
    .update({ name, invited_email: email })
    .eq('id', member_id)

  // Update auth user
  if (user_id) {
    const updates: { email?: string; password?: string; user_metadata?: { name: string } } = {
      user_metadata: { name }
    }
    if (email) updates.email = email
    if (password && password.length >= 6) updates.password = password
    await supabase.auth.admin.updateUserById(user_id, updates)
  }

  return NextResponse.json({ success: true })
}