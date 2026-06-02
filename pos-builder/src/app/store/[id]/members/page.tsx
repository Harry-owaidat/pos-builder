import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { MembersManager } from '@/components/dashboard/MembersManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check if admin or manager
  const { data: ownStore } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('store_members')
    .select('role')
    .eq('store_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const isAdmin = !!ownStore
  const isManager = membership?.role === 'manager'

  if (!isAdmin && !isManager) notFound()

  // Get store using admin client if manager
  let store = ownStore
  if (!store && isManager) {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()
    store = data
  }

  if (!store) notFound()

  const { data: members } = await supabase
    .from('store_members')
    .select('*')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  return (
    <MembersManager
      store={store as any}
      initialMembers={members || []}
      isAdmin={isAdmin}
    />
  )
}