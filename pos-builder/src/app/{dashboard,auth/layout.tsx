import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: storesRaw } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  const stores = storesRaw || []

  let userRole: 'admin' | 'manager' | 'cashier' = 'admin'

  if (stores.length === 0) {
    const { data: membership } = await supabase
      .from('store_members')
      .select('store_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membership) {
      if (membership.role === 'cashier') {
        redirect(`/store/${membership.store_id}/pos`)
      }
      userRole = membership.role as 'manager'
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