'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, ShoppingCart, Package, Users, BarChart2, Receipt, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Store as StoreType } from '@/types'
import { STORE_TYPE_ICONS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/dashboard/NotificationBell'

interface Props {
  user: User
  stores: StoreType[]
}

export function DashboardSidebar({ user, stores }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 flex flex-col h-full">
      
      {/* Header - Logo + User + Notifications */}
      <div className="px-4 py-4 border-b border-surface-100 dark:border-surface-800">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="font-display font-bold text-base tracking-tight text-surface-900 dark:text-white">POS Builder</span>
        </div>

        {/* User + Notifications */}
        <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-xl px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">{user.email}</p>
            <p className="text-xs text-surface-400">Free plan</p>
          </div>
          <NotificationBell storeIds={stores.map(s => s.id)} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon={<LayoutDashboard size={16} />} label="Overview" active={pathname === '/dashboard'} />

        {stores.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-3 mb-2">My Stores</p>
            {stores.map((store) => (
              <div key={store.id} className="mb-1">
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 font-medium')}>
                  <span className="text-base">{STORE_TYPE_ICONS[store.type]}</span>
                  <span className="truncate flex-1">{store.name}</span>
                </div>
                <div className="ml-7 space-y-0.5">
                  <NavItem href={`/store/${store.id}/pos`} icon={<ShoppingCart size={14} />} label="POS Terminal" active={pathname === `/store/${store.id}/pos`} small />
                  <NavItem href={`/store/${store.id}/products`} icon={<Package size={14} />} label="Products" active={pathname === `/store/${store.id}/products`} small />
                  <NavItem href={`/store/${store.id}/members`} icon={<Users size={14} />} label="Team Members" active={pathname === `/store/${store.id}/members`} small />
                  <NavItem href={`/store/${store.id}/sales`} icon={<BarChart2 size={14} />} label="Sales Report" active={pathname === `/store/${store.id}/sales`} small />
                  <NavItem href={`/store/${store.id}/expenses`} icon={<Receipt size={14} />} label="Expenses" active={pathname === `/store/${store.id}/expenses`} small />
                  <NavItem href={`/store/${store.id}/suppliers`} icon={<Truck size={14} />} label="Suppliers" active={pathname === `/store/${store.id}/suppliers`} small />
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer - Sign Out */}
      <div className="px-3 py-3 border-t border-surface-100 dark:border-surface-800">
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active, small }: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  small?: boolean
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 rounded-xl transition-colors', small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm', active ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium')}>
      {icon}
      {label}
    </Link>
  )
}