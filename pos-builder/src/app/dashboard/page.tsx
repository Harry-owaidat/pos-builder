import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CreateStoreModal } from '@/components/dashboard/CreateStoreModal'
import { STORE_TYPE_LABELS, STORE_TYPE_ICONS, formatCurrency } from '@/lib/utils'
import { ShoppingCart, Package, TrendingUp } from 'lucide-react'
import type { Store, StoreType } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: storesRaw } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  const stores = (storesRaw || []) as Store[]

  const salesData: Record<string, number> = {}
  const salesTotals: Record<string, number> = {}

  for (const store of stores) {
    const { data: sales } = await supabase
      .from('sales')
      .select('total')
      .eq('store_id', store.id)

    const salesTyped = (sales || []) as { total: number }[]
    salesData[store.id] = salesTyped.length
    salesTotals[store.id] = salesTyped.reduce((a, s) => a + (s.total || 0), 0)
  }

  const totalRevenue = Object.values(salesTotals).reduce((a, b) => a + b, 0)
  const totalSales = Object.values(salesData).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-100">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage your POS stores</p>
        </div>
        <CreateStoreModal />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Package className="text-brand-600" size={20} />} label="Total Stores" value={String(stores.length)} color="brand" />
        <StatCard icon={<ShoppingCart className="text-emerald-600" size={20} />} label="Total Sales" value={String(totalSales)} color="emerald" />
        <StatCard icon={<TrendingUp className="text-violet-600" size={20} />} label="Total Revenue" value={formatCurrency(totalRevenue)} color="violet" />
      </div>

      {stores.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No stores yet</h3>
            <p className="text-sm text-surface-500 mb-6">Create your first POS store to get started</p>
            <CreateStoreModal />
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="font-semibold text-surface-700 dark:text-surface-300 text-sm uppercase tracking-wider mb-4">Your Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card key={store.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xl">
                        {STORE_TYPE_ICONS[store.type as StoreType]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{store.name}</h3>
                        <Badge variant="info" className="mt-0.5 text-xs">{STORE_TYPE_LABELS[store.type as StoreType]}</Badge>
                      </div>
                    </div>
                    <Badge variant={store.theme === 'dark' ? 'default' : 'warning'}>{store.theme}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-2.5">
                      <div className="font-bold text-surface-900 dark:text-surface-100 text-sm">{salesData[store.id] || 0}</div>
                      <div className="text-xs text-surface-500">Sales</div>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-2.5">
                      <div className="font-bold text-surface-900 dark:text-surface-100 text-sm">{formatCurrency(salesTotals[store.id] || 0)}</div>
                      <div className="text-xs text-surface-500">Revenue</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/store/${store.id}/pos`} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                      <ShoppingCart size={13} /> Open POS
                    </Link>
                    <Link href={`/store/${store.id}/products`} className="flex-1 flex items-center justify-center gap-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                      <Package size={13} /> Products
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    violet: 'bg-violet-50 dark:bg-violet-900/20',
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg[color]} flex items-center justify-center`}>{icon}</div>
          <div>
            <p className="text-xs text-surface-500">{label}</p>
            <p className="font-display font-bold text-xl text-surface-900 dark:text-surface-100">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
