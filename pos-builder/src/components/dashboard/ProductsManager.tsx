'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Package, ArrowLeft, ShoppingCart, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, Product } from '@/types'
import { STORE_TYPE_ICONS, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  store: Store
  initialProducts: Product[]
}

interface ProductForm {
  name: string
  price: string
  stock: string
  category: string
}

const emptyForm: ProductForm = { name: '', price: '', stock: '0', category: '' }

export function ProductsManager({ store, initialProducts }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const price = parseFloat(form.price)
    const stock = parseInt(form.stock)

    if (isNaN(price) || price < 0) {
      setError('Invalid price')
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (editingId) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: form.name.trim(),
          price,
          stock: isNaN(stock) ? 0 : stock,
          category: form.category.trim() || null,
        })
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setProducts((prev) => prev.map((p) => p.id === editingId ? data : p))
        closeForm()
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: form.name.trim(),
          price,
          stock: isNaN(stock) ? 0 : stock,
          category: form.category.trim() || null,
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setProducts((prev) => [data, ...prev])
        closeForm()
      }
    }

    setLoading(false)
  }

  async function handleDelete(productId: string) {
    setDeletingId(productId)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    }
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{STORE_TYPE_ICONS[store.type]}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
              {store.name}
            </h1>
            <p className="text-sm text-surface-500">Product Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/store/${store.id}/pos`}>
            <Button variant="outline" size="sm">
              <ShoppingCart size={14} />
              Open POS
            </Button>
          </Link>
          <Button onClick={openCreate} size="sm">
            <Plus size={14} />
            Add Product
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Product Name"
                placeholder="e.g. Cheeseburger"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
                <Input
                  label="Stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <Input
                label="Category (optional)"
                placeholder="e.g. Burgers, Medicine"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  {editingId ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">
              No products yet
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Add your first product to start selling
            </p>
            <Button onClick={openCreate}>
              <Plus size={16} />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg shrink-0">
                    {store.type === 'restaurant' ? '🍔' : store.type === 'pharmacy' ? '💊' : '📦'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
                        {product.name}
                      </span>
                      {product.category && (
                        <Badge variant="default">{product.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-brand-600 font-bold text-sm">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-xs ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-amber-500' : 'text-surface-400'}`}>
                        {product.stock === 0 ? '⚠️ Out of stock' : `${product.stock} in stock`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(product)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === product.id ? (
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
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
