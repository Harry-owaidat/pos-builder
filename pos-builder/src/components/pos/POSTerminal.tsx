'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, ArrowLeft, Package, Banknote, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, Product, CartItem, PaymentMethod } from '@/types'
import { cn, formatCurrency, STORE_TYPE_ICONS } from '@/lib/utils'

interface Props {
  store: Store
  initialProducts: Product[]
}

const PAYMENT_METHODS = [
  { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard, color: 'bg-brand-500' },
  { id: 'qr' as PaymentMethod, label: 'QR / Online', icon: QrCode, color: 'bg-violet-500' },
]

export function POSTerminal({ store, initialProducts }: Props) {
  const [products] = useState<Product[]>(initialProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash')

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
    cart.reduce((sum, item) => sum + item.product.price * item.qty, 0), [cart])

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0))
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
      const { data: { user } } = await supabase.auth.getUser()

    const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .insert({ 
    store_id: store.id, 
    total, 
    items_count: itemCount, 
    payment_method: selectedPayment,
    cashier_id: user?.id,
    cashier_email: user?.email,
  })
  .select().single()

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Failed to create sale')

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
      setShowPayment(false)
      setTimeout(() => { setCart([]); setSuccess(false) }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const theme = isDark ? {
    bg: 'bg-surface-950', panel: 'bg-surface-900', card: 'bg-surface-800 hover:bg-surface-700 border-surface-700',
    text: 'text-surface-100', textMuted: 'text-surface-400', border: 'border-surface-700',
    input: 'bg-surface-800 border-surface-700 text-surface-100 placeholder:text-surface-500',
  } : {
    bg: 'bg-surface-50', panel: 'bg-white', card: 'bg-white hover:bg-brand-50 border-surface-200',
    text: 'text-surface-900', textMuted: 'text-surface-500', border: 'border-surface-200',
    input: 'bg-white border-surface-200 text-surface-900 placeholder:text-surface-400',
  }

  return (
    <div className={cn('flex h-screen overflow-hidden', theme.bg)}>
      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayment(false)} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-surface-100 dark:border-surface-800 animate-scale-in">
            <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">Select Payment</h2>
            <p className="text-sm text-surface-500 mb-5">Total: <span className="font-bold text-brand-600 text-lg">{formatCurrency(total)}</span></p>

            <div className="space-y-3 mb-6">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all',
                      selectedPayment === method.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', method.color)}>
                      <Icon size={20} />
                    </div>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">{method.label}</span>
                    {selectedPayment === method.id && (
                      <span className="ml-auto text-brand-600 font-bold">✓</span>
                    )}
                  </button>
                )
              })}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            {success ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold px-4 py-3 rounded-xl text-center">
                ✓ Payment successful!
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-50"
              >
                {paying ? 'Processing...' : `Confirm ${PAYMENT_METHODS.find(m => m.id === selectedPayment)?.label} Payment`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={cn('flex items-center gap-4 px-5 py-4 border-b', theme.panel, theme.border)}>
          <Link href="/dashboard" className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', isDark ? 'hover:bg-surface-700 text-surface-400' : 'hover:bg-surface-100 text-surface-500')}>
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{STORE_TYPE_ICONS[store.type]}</span>
            <div>
              <h1 className={cn('font-display font-bold text-base leading-tight', theme.text)}>{store.name}</h1>
              <p className={cn('text-xs', theme.textMuted)}>POS Terminal</p>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', theme.textMuted)} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn('w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all', theme.input)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package size={48} className={cn('mb-4', theme.textMuted)} />
              <p className={cn('font-semibold mb-1', theme.text)}>No products yet</p>
              <Link href={`/store/${store.id}/products`} className="text-sm text-brand-600 hover:text-brand-700 font-medium">Manage Products →</Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={cn('text-center py-12', theme.textMuted)}>No products matching "{search}"</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn('flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer', theme.card)}
                >
                  {/* Product Image */}
                  <div className={cn('w-full h-24 rounded-xl mb-3 overflow-hidden flex items-center justify-center', isDark ? 'bg-surface-700' : 'bg-surface-100')}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">
                        {store.type === 'restaurant' ? '🍔' : store.type === 'pharmacy' ? '💊' : '📦'}
                      </span>
                    )}
                  </div>
                  <p className={cn('font-semibold text-sm leading-snug mb-1', theme.text)}>{product.name}</p>
                  {product.category && <p className={cn('text-xs mb-1', theme.textMuted)}>{product.category}</p>}
                  <p className="font-bold text-brand-600 text-sm mt-auto">{formatCurrency(product.price)}</p>
                  {product.stock === 0 && <p className="text-xs text-red-500 mt-0.5">Out of stock</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className={cn('w-80 xl:w-96 flex flex-col border-l', theme.panel, theme.border)}>
        <div className={cn('flex items-center justify-between px-5 py-4 border-b', theme.border)}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-600" />
            <span className={cn('font-display font-bold', theme.text)}>Cart</span>
            {itemCount > 0 && <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{itemCount}</span>}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className={cn('text-xs font-medium transition-colors', isDark ? 'text-surface-500 hover:text-red-400' : 'text-surface-400 hover:text-red-500')}>
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className={cn('flex flex-col items-center justify-center h-full text-center py-12', theme.textMuted)}>
              <ShoppingCart size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Tap a product to add it</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border', isDark ? 'border-surface-700 bg-surface-800' : 'border-surface-100 bg-surface-50')}>
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-100 dark:bg-surface-700">
                  {item.product.image_url
                    ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    : <span className="text-lg">{store.type === 'restaurant' ? '🍔' : store.type === 'pharmacy' ? '💊' : '📦'}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', theme.text)}>{item.product.name}</p>
                  <p className="text-xs text-brand-600 font-medium">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQty(item.product.id, -1)} className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors', isDark ? 'bg-surface-700 hover:bg-surface-600 text-surface-300' : 'bg-surface-200 hover:bg-surface-300 text-surface-600')}>
                    <Minus size={12} />
                  </button>
                  <span className={cn('w-6 text-center font-bold text-sm', theme.text)}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center bg-brand-100 hover:bg-brand-200 text-brand-700 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-bold', theme.text)}>{formatCurrency(item.product.price * item.qty)}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-surface-400 hover:text-red-500 transition-colors mt-0.5">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={cn('px-5 py-5 border-t space-y-4', theme.border)}>
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

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-semibold px-4 py-3 rounded-xl text-center animate-fade-in">
              ✓ Payment successful!
            </div>
          ) : (
            <button
              onClick={() => { if (cart.length > 0) setShowPayment(true) }}
              disabled={cart.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all',
                cart.length === 0
                  ? isDark ? 'bg-surface-800 text-surface-600 cursor-not-allowed' : 'bg-surface-100 text-surface-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5'
              )}
            >
              <CreditCard size={18} />
              Pay {cart.length > 0 ? formatCurrency(total) : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}