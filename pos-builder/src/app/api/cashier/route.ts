import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(request: Request) {
  const { user_id, member_id, email } = await request.json()
  const supabase = getAdmin()

  // 1. Delete from store_members
  await supabase.from('store_members').delete().eq('id', member_id)

  // 2. Delete from auth.users
  if (user_id) {
    await supabase.auth.admin.deleteUser(user_id)
  } else if (email) {
    // Find by email and delete
    const { data } = await supabase.auth.admin.listUsers()
const found = data?.users?.find((u) => u.email === email.toLowerCase())   
 if (found) {
      await supabase.auth.admin.deleteUser(found.id)
    }
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const { user_id, member_id, name, email, password } = await request.json()
  const supabase = getAdmin()

  await supabase
    .from('store_members')
    .update({ name, invited_email: email })
    .eq('id', member_id)

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