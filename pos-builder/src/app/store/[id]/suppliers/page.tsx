import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuppliersManager } from '@/components/dashboard/SuppliersManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SuppliersPage({ params }: Props) {
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

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*, supplier_invoices(*)')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  return <SuppliersManager store={store as any} initialSuppliers={suppliers || []} />
}