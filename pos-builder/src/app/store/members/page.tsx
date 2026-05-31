import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MembersManager } from '@/components/dashboard/MembersManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: Props) {
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

  const { data: members } = await supabase
    .from('store_members')
    .select('*')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  return <MembersManager store={store as any} initialMembers={members || []} />
}