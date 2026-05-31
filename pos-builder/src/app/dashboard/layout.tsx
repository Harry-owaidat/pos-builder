import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stores = user ? await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
    .then(({ data }: { data: unknown[] | null }) => data || []) : []

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <DashboardSidebar user={user as any} stores={stores as any} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}