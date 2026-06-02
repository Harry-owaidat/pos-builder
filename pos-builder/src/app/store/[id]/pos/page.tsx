import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { POSTerminal } from '@/components/pos/POSTerminal'

interface Props {
  params: Promise<{ id: string }>
}

export default async function POSPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check if admin or member
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

  if (!ownStore && !membership) notFound()

  // Get store using admin client if member
  let store = ownStore
  if (!store) {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()
    store = data
  }

  if (!store) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', id)
    .order('name')

  return (
    <POSTerminal
      store={store}
      initialProducts={products || []}
    />
  )
}