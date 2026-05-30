import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { POSTerminal } from '@/components/pos/POSTerminal'

interface Props {
  params: Promise<{ id: string }>
}

export default async function POSPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

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
