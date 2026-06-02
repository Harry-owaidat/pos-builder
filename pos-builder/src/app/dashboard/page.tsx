import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CreateStoreModal } from '@/components/dashboard/CreateStoreModal'
import { STORE_TYPE_LABELS, STORE_TYPE_ICONS, formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingCart, Package, TrendingUp, Users } from 'lucide-react'
import type { Store, StoreType } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check role
  const { data: membership } = await supabase
    .from('store_members')
    .select('store_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const isAdmin = !membership || membership.role === 'admin'
  const isManager = membership?.role === 'manager'

  // Get stores
  let stores: Store[] = []

  if (isAdmin) {
    const { data: ownStores } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })
    stores = (ownStores || []) as Store[]
  } else if (isManager && membership) {
    const adminClient = createAdminClient()
    const { data: memberStore } = await adminClient
      .from('stores')
      .select('*')
      .eq('id', membership.store_id)
      .single()
    if (memberStore) stores = [memberStore as Store]
  }

  const salesData: Record<string, number> = {}
  const salesTotals: Record<string, number> = {}
  const paymentStats: Record<string, Record<string, number>> = {}
  const recentSales: Record<string, { total: number; payment_method: string; cashier_email: string; created_at: string }[]> = {}

  for (const store of stores) {
    const { data: sales } = await supabase
      .from('sales')
      .select('total, payment_method, cashier_email, created_at')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })

    const salesTyped = (sales || []) as { total: number; payment_method: string; cashier_email: string; created_at: string }[]
    salesData[store.id] = salesTyped.length
    salesTotals[store.id] = salesTyped.reduce((a, s) => a + (s.total || 0), 0)
    recentSales[store.id] = salesTyped.slice(0, 5)

    paymentStats[store.id] = { cash: 0, card: 0, qr: 0 }
    salesTyped.forEach((s) => {
      if (s.payment_method in paymentStats[store.id]) {
        paymentStats[store.id][s.payment_method] += s.total
      }
    })
  }

  const totalRevenue = Object.values(salesTotals).reduce((a, b) => a + b, 0)
  const totalSales = Object.values(salesData).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-100">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {isManager ? 'Store Overview' : 'Manage your POS stores'}
          </p>
        </div>
        {/* Only Admin can create stores */}
        {isAdmin && <CreateStoreModal />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Package className="text-brand-600" size={20} />} label="Total Stores" value={String(stores.length)} color="brand" />
        <StatCard icon={<ShoppingCart className="text-emerald-600" size={20} />} label="Total Sales" value={String(totalSales)} color="emerald" />
        <StatCard icon={<TrendingUp className="text-violet-600" size={20} />} label="Total Revenue" value={formatCurrency(totalRevenue)} color="violet" />
      </div>

      {/* Stores */}
      {stores.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No stores yet</h3>
            <p className="text-sm text-surface-500 mb-6">Create your first POS store to get started</p>
            {isAdmin && <CreateStoreModal />}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <h2 className="font-semibold text-surface-700 dark:text-surface-300 text-sm uppercase tracking-wider">Your Stores</h2>
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden">
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

                <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-2.5">
                    <div className="font-bold text-surface-900 dark:text-surface-100 text-sm">{salesData[store.id] || 0}</div>
                    <div className="text-xs text-surface-500">Sales</div>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-2.5">
                    <div className="font-bold text-surface-900 dark:text-surface-100 text-sm">{formatCurrency(salesTotals[store.id] || 0)}</div>
                    <div className="text-xs text-surface-500">Revenue</div>
                  </div>
                </div>

                {salesData[store.id] > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 text-center">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">💵 {formatCurrency(paymentStats[store.id]?.cash || 0)}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-500">Cash</div>
                    </div>
                    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-2 text-center">
                      <div className="text-xs font-bold text-brand-700 dark:text-brand-400">💳 {formatCurrency(paymentStats[store.id]?.card || 0)}</div>
                      <div className="text-xs text-brand-600 dark:text-brand-500">Card</div>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-2 text-center">
                      <div className="text-xs font-bold text-violet-700 dark:text-violet-400">📱 {formatCurrency(paymentStats[store.id]?.qr || 0)}</div>
                      <div className="text-xs text-violet-600 dark:text-violet-500">QR</div>
                    </div>
                  </div>
                )}

                {recentSales[store.id]?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Recent Sales</p>
                    <div className="space-y-1.5">
                      {recentSales[store.id].map((sale, i) => (
                        <div key={i} className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {sale.payment_method === 'cash' ? '💵' : sale.payment_method === 'card' ? '💳' : '📱'}
                            </span>
                            <span className="text-xs text-surface-500 truncate max-w-[120px]">
                              {sale.cashier_email || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-surface-900 dark:text-surface-100">
                              {formatCurrency(sale.total)}
                            </span>
                            <span className="text-xs text-surface-400">
                              {formatDate(sale.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/store/${store.id}/pos`} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                    <ShoppingCart size={13} />Open POS
                  </Link>
                  <Link href={`/store/${store.id}/products`} className="flex-1 flex items-center justify-center gap-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                    <Package size={13} />Products
                  </Link>
                  {/* Only Admin sees Members button */}
                  {isAdmin && (
                    <Link href={`/store/${store.id}/members`} className="flex items-center justify-center gap-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                      <Users size={13} />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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