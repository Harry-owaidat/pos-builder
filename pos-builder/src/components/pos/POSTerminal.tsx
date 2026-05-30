'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, ArrowLeft, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, Product, CartItem } from '@/types'
import { cn, formatCurrency, STORE_TYPE_ICONS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Props {
  store: Store
  initialProducts: Product[]
}

export function POSTerminal({ store, initialProducts }: Props) {
  const router = useRouter()
  const [products] = useState<Product[]>(initialProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isDark = store.theme === 'dark'

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
  }, [products, search])

  const total = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cart]
  )

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  async function handlePay() {
    if (cart.length === 0) return
    setPaying(true)
    setError('')

    const supabase = createClient()

    try {
      // Insert sale
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          store_id: store.id,
          total,
          items_count: itemCount,
        })
        .select()
        .single()

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Failed to create sale')

      // Insert sale items
      const { error: itemsErr } = await supabase.from('sale_items').insert(
        cart.map((item) => ({
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          qty: item.qty,
          price: item.product.price,
        }))
      )

      if (itemsErr) throw new Error(itemsErr.message)

      setSuccess(true)
      setTimeout(() => {
        setCart([])
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const theme = isDark ? {
    bg: 'bg-surface-950',
    panel: 'bg-surface-900',
    card: 'bg-surface-800 hover:bg-surface-700 border-surface-700',
    text: 'text-surface-100',
    textMuted: 'text-surface-400',
    border: 'border-surface-700',
    input: 'bg-surface-800 border-surface-700 text-surface-100 placeholder:text-surface-500',
  } : {
    bg: 'bg-surface-50',
    panel: 'bg-white',
    card: 'bg-white hover:bg-brand-50 border-surface-200',
    text: 'text-surface-900',
    textMuted: 'text-surface-500',
    border: 'border-surface-200',
    input: 'bg-white border-surface-200 text-surface-900 placeholder:text-surface-400',
  }

  return (
    <div className={cn('flex h-screen overflow-hidden', theme.bg)}>
      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={cn('flex items-center gap-4 px-5 py-4 border-b', theme.panel, theme.border)}>
          <Link
            href="/dashboard"
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', 
              isDark ? 'hover:bg-surface-700 text-surface-400' : 'hover:bg-surface-100 text-surface-500'
            )}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{STORE_TYPE_ICONS[store.type]}</span>
            <div>
              <h1 className={cn('font-display font-bold text-base leading-tight', theme.text)}>
                {store.name}
              </h1>
              <p className={cn('text-xs', theme.textMuted)}>POS Terminal</p>
            </div>
          </div>

          <div className={cn('relative flex-1 max-w-xs')}>
            <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', theme.textMuted)} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all',
                theme.input
              )}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package size={48} className={cn('mb-4', theme.textMuted)} />
              <p className={cn('font-semibold mb-1', theme.text)}>No products yet</p>
              <p className={cn('text-sm mb-4', theme.textMuted)}>Add products to start selling</p>
              <Link
                href={`/store/${store.id}/products`}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Manage Products →
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={cn('text-center py-12', theme.textMuted)}>
              No products matching "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer',
                    theme.card
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl mb-3 flex items-center justify-center text-lg',
                    isDark ? 'bg-surface-700' : 'bg-surface-100'
                  )}>
                    {store.type === 'restaurant' ? '🍔' : store.type === 'pharmacy' ? '💊' : '📦'}
                  </div>
                  <p className={cn('font-semibold text-sm leading-snug mb-1', theme.text)}>{product.name}</p>
                  {product.category && (
                    <p className={cn('text-xs mb-2', theme.textMuted)}>{product.category}</p>
                  )}
                  <p className="font-bold text-brand-600 text-sm mt-auto">
                    {formatCurrency(product.price)}
                  </p>
                  {product.stock !== null && product.stock !== undefined && (
                    <p className={cn('text-xs mt-0.5', product.stock < 5 ? 'text-amber-500' : theme.textMuted)}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className={cn('w-80 xl:w-96 flex flex-col border-l', theme.panel, theme.border)}>
        {/* Cart Header */}
        <div className={cn('flex items-center justify-between px-5 py-4 border-b', theme.border)}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-600" />
            <span className={cn('font-display font-bold', theme.text)}>Cart</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className={cn('text-xs font-medium transition-colors', 
                isDark ? 'text-surface-500 hover:text-red-400' : 'text-surface-400 hover:text-red-500'
              )}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className={cn('flex flex-col items-center justify-center h-full text-center py-12', theme.textMuted)}>
              <ShoppingCart size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Tap a product to add it</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className={cn('flex items-center gap-3 p-3 rounded-2xl border', 
                  isDark ? 'border-surface-700 bg-surface-800' : 'border-surface-100 bg-surface-50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', theme.text)}>{item.product.name}</p>
                  <p className="text-xs text-brand-600 font-medium">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
                      isDark ? 'bg-surface-700 hover:bg-surface-600 text-surface-300' : 'bg-surface-200 hover:bg-surface-300 text-surface-600'
                    )}
                  >
                    <Minus size={12} />
                  </button>
                  <span className={cn('w-6 text-center font-bold text-sm', theme.text)}>{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-brand-100 hover:bg-brand-200 text-brand-700 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-bold', theme.text)}>
                    {formatCurrency(item.product.price * item.qty)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-surface-400 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className={cn('px-5 py-5 border-t space-y-4', theme.border)}>
          {/* Summary */}
          <div className="space-y-2">
            <div className={cn('flex justify-between text-sm', theme.textMuted)}>
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className={cn('flex justify-between font-bold text-base pt-2 border-t', theme.text, theme.border)}>
              <span className="font-display">Total</span>
              <span className="text-brand-600 text-xl">{formatCurrency(total)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-semibold px-4 py-3 rounded-xl text-center animate-fade-in">
              ✓ Payment successful!
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={cart.length === 0 || paying}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all',
                cart.length === 0
                  ? isDark ? 'bg-surface-800 text-surface-600 cursor-not-allowed' : 'bg-surface-100 text-surface-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:-translate-y-0.5'
              )}
            >
              {paying ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay {cart.length > 0 ? formatCurrency(total) : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
