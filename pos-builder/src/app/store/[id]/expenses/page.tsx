import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpensesManager } from '@/components/dashboard/ExpensesManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExpensesPage({ params }: Props) {
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

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  return <ExpensesManager store={store as any} initialExpenses={expenses || []} />
}