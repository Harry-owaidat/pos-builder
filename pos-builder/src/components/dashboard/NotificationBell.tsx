'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, AlertCircle, Clock, Package, Users, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  store_id: string
  title: string
  message: string
  type: 'invoice' | 'stock' | 'cashier' | 'expense'
  priority: 'low' | 'medium' | 'high'
  read: boolean
  link?: string
  created_at: string
}

interface Props {
  storeIds: string[]
}

const TYPE_CONFIG = {
  invoice: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  stock: { icon: Package, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  cashier: { icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  expense: { icon: Clock, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
}

const PRIORITY_COLORS = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-amber-500',
  low: 'border-l-4 border-l-brand-500',
}

export function NotificationBell({ storeIds }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (storeIds.length > 0) {
      loadNotifications()
      checkAutoNotifications()
    }
  }, [storeIds])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications((data || []) as Notification[])
  }

  async function checkAutoNotifications() {
    const supabase = createClient()

    for (const storeId of storeIds) {
      // Check overdue invoices
      const { data: invoices } = await supabase
        .from('supplier_invoices')
        .select('*, suppliers(name)')
        .eq('store_id', storeId)
        .neq('status', 'paid')

      if (invoices) {
        const today = new Date()
        const in3Days = new Date()
        in3Days.setDate(today.getDate() + 3)

        for (const inv of invoices) {
          if (!inv.due_date) continue
          const dueDate = new Date(inv.due_date)

          if (dueDate < today) {
            await createNotificationIfNew(storeId, {
              title: '🔴 Overdue Invoice!',
              message: `Invoice from ${(inv.suppliers as any)?.name} is overdue. Amount due: $${(inv.total_amount - inv.paid_amount).toFixed(2)}`,
              type: 'invoice',
              priority: 'high',
              link: `/store/${storeId}/suppliers`,
            })
          } else if (dueDate <= in3Days) {
            await createNotificationIfNew(storeId, {
              title: '🟡 Invoice Due Soon',
              message: `Invoice from ${(inv.suppliers as any)?.name} is due in ${Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days.`,
              type: 'invoice',
              priority: 'medium',
              link: `/store/${storeId}/suppliers`,
            })
          }
        }
      }

      // Check low stock
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .lte('stock', 5)

      if (products) {
        for (const product of products) {
          if (product.stock === 0) {
            await createNotificationIfNew(storeId, {
              title: '🔴 Out of Stock!',
              message: `${product.name} is out of stock.`,
              type: 'stock',
              priority: 'high',
              link: `/store/${storeId}/products`,
            })
          } else {
            await createNotificationIfNew(storeId, {
              title: '🟠 Low Stock Warning',
              message: `${product.name} has only ${product.stock} items left.`,
              type: 'stock',
              priority: 'medium',
              link: `/store/${storeId}/products`,
            })
          }
        }
      }
    }

    await loadNotifications()
  }

  async function createNotificationIfNew(
    storeId: string,
    notification: Omit<Notification, 'id' | 'store_id' | 'read' | 'created_at'>
  ) {
    const supabase = createClient()

    // Check if similar notification exists in last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('store_id', storeId)
      .eq('title', notification.title)
      .eq('message', notification.message)
      .gte('created_at', yesterday.toISOString())
      .single()

    if (!existing) {
      await supabase.from('notifications').insert({
        store_id: storeId,
        ...notification,
        read: false,
      })
    }
  }

  async function markAsRead(notificationId: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
  }

  async function markAllAsRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).in('store_id', storeIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function deleteNotification(notificationId: string) {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-800 z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-surface-600 dark:text-surface-400" />
              <span className="font-semibold text-surface-900 dark:text-surface-100 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                <CheckCircle size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-surface-300 mb-3" />
                <p className="text-sm text-surface-400">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type]
                const Icon = config.icon
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer',
                      PRIORITY_COLORS[notification.priority],
                      !notification.read && 'bg-brand-50/30 dark:bg-brand-900/10'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                      <Icon size={15} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-semibold leading-snug', !notification.read ? 'text-surface-900 dark:text-surface-100' : 'text-surface-600 dark:text-surface-400')}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                          className="shrink-0 text-surface-300 hover:text-surface-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5 leading-snug">{notification.message}</p>
                      <p className="text-xs text-surface-400 mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}