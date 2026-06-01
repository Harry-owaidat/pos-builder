'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, ShoppingCart, Banknote, CreditCard, QrCode, Calendar } from 'lucide-react'
import type { Store, Sale } from '@/types'
import { STORE_TYPE_ICONS, formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  store: Store
  initialSales: Sale[]
}

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

export function SalesReport({ store, initialSales }: Props) {
  const [period, setPeriod] = useState<Period>('today')

  const filteredSales = useMemo(() => {
    const now = new Date()
    return initialSales.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      switch (period) {
        case 'today':
          return saleDate.toDateString() === now.toDateString()
        case 'week': {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return saleDate >= weekAgo
        }
        case 'month':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
        case 'year':
          return saleDate.getFullYear() === now.getFullYear()
        case 'all':
          return true
      }
    })
  }, [initialSales, period])

  const totalRevenue = filteredSales.reduce((a, s) => a + s.total, 0)
  const cashTotal = filteredSales.filter(s => s.payment_method === 'cash').reduce((a, s) => a + s.total, 0)
  const cardTotal = filteredSales.filter(s => s.payment_method === 'card').reduce((a, s) => a + s.total, 0)
  const qrTotal = filteredSales.filter(s => s.payment_method === 'qr').reduce((a, s) => a + s.total, 0)

  const periods: { id: Period; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{STORE_TYPE_ICONS[store.type]}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">{store.name}</h1>
            <p className="text-sm text-surface-500">Sales Report</p>
          </div>
        </div>
        <Link href={`/store/${store.id}/pos`} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors">
          <ShoppingCart size={13} />Open POS
        </Link>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              period === p.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-brand-600" />
              <span className="text-xs text-surface-500">Total Revenue</span>
            </div>
            <p className="font-display font-bold text-lg text-surface-900 dark:text-surface-100">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-surface-400">{filteredSales.length} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={14} className="text-emerald-600" />
              <span className="text-xs text-surface-500">Cash</span>
            </div>
            <p className="font-display font-bold text-lg text-emerald-600">{formatCurrency(cashTotal)}</p>
            <p className="text-xs text-surface-400">{filteredSales.filter(s => s.payment_method === 'cash').length} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={14} className="text-brand-600" />
              <span className="text-xs text-surface-500">Card</span>
            </div>
            <p className="font-display font-bold text-lg text-brand-600">{formatCurrency(cardTotal)}</p>
            <p className="text-xs text-surface-400">{filteredSales.filter(s => s.payment_method === 'card').length} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <QrCode size={14} className="text-violet-600" />
              <span className="text-xs text-surface-500">QR</span>
            </div>
            <p className="font-display font-bold text-lg text-violet-600">{formatCurrency(qrTotal)}</p>
            <p className="text-xs text-surface-400">{filteredSales.filter(s => s.payment_method === 'qr').length} sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No sales yet</h3>
            <p className="text-sm text-surface-500">No sales found for this period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">
            {filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}
          </p>
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm ${
                      sale.payment_method === 'cash' ? 'bg-emerald-500' :
                      sale.payment_method === 'card' ? 'bg-brand-500' : 'bg-violet-500'
                    }`}>
                      {sale.payment_method === 'cash' ? '💵' : sale.payment_method === 'card' ? '💳' : '📱'}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
                        {(sale as any).cashier_email || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={
                          sale.payment_method === 'cash' ? 'success' :
                          sale.payment_method === 'card' ? 'info' : 'default'
                        }>
                          {sale.payment_method}
                        </Badge>
                        <span className="text-xs text-surface-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(sale.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-surface-900 dark:text-surface-100">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-surface-400">{sale.items_count} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}