import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Use admin client to check membership (bypass RLS)
  const adminClient = createAdminClient()
  const { data: membership } = await adminClient
    .from('store_members')
    .select('store_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Cashier → POS only
  if (membership?.role === 'cashier') {
    redirect(`/store/${membership.store_id}/pos`)
  }

  // Get own stores (admin)
  const { data: ownStores } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  let stores = ownStores || []
  let userRole: 'admin' | 'manager' | 'cashier' = 'admin'

  // Manager - get their store using admin client
  if (membership?.role === 'manager') {
    userRole = 'manager'
    if (stores.length === 0) {
      const { data: memberStore } = await adminClient
        .from('stores')
        .select('*')
        .eq('id', membership.store_id)
        .single()
      if (memberStore) stores = [memberStore]
    }
  }

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <DashboardSidebar user={user as any} stores={stores as any} userRole={userRole} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}