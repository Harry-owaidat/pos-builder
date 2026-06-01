'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, X, ShoppingCart, Pencil, Search, TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, Expense, ExpenseCategory } from '@/types'
import { STORE_TYPE_ICONS, formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  store: Store
  initialExpenses: Expense[]
}

interface ExpenseForm {
  description: string
  amount: string
  category: ExpenseCategory
  notes: string
}

const emptyForm: ExpenseForm = { description: '', amount: '', category: 'other', notes: '' }

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: '🏠 Rent',
  salary: '👤 Salary',
  utilities: '💡 Utilities',
  supplies: '📦 Supplies',
  other: '📝 Other',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  salary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  utilities: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  supplies: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  other: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400',
}

export function ExpensesManager({ store, initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  )

  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return totals
  }, [expenses])

  function openAdd() {
    setEditingExpense(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense)
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      notes: expense.notes || '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount')
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (editingExpense) {
      const { data, error: err } = await supabase
        .from('expenses')
        .update({
          description: form.description.trim(),
          amount,
          category: form.category,
          notes: form.notes.trim() || null,
        })
        .eq('id', editingExpense.id)
        .select()
        .single()

      if (err) {
        setError(err.message)
      } else if (data) {
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? data as Expense : e))
        closeForm()
      }
    } else {
      const { data, error: err } = await supabase
        .from('expenses')
        .insert({
          store_id: store.id,
          description: form.description.trim(),
          amount,
          category: form.category,
          notes: form.notes.trim() || null,
        })
        .select()
        .single()

      if (err) {
        setError(err.message)
      } else if (data) {
        setExpenses(prev => [data as Expense, ...prev])
        closeForm()
      }
    }

    setLoading(false)
  }

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete "${expense.description}"?`)) return
    setDeletingId(expense.id)

    const supabase = createClient()
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)

    if (!error) {
      setExpenses(prev => prev.filter(e => e.id !== expense.id))
    }

    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{STORE_TYPE_ICONS[store.type]}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">{store.name}</h1>
            <p className="text-sm text-surface-500">Expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/store/${store.id}/pos`}>
            <Button variant="outline" size="sm"><ShoppingCart size={14} />Open POS</Button>
          </Link>
          <Button onClick={openAdd} size="sm"><Plus size={14} />Add Expense</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} className="text-red-500" />
              <span className="text-xs text-surface-500">Total Expenses</span>
            </div>
            <p className="font-display font-bold text-lg text-red-600">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-surface-400">{expenses.length} entries</p>
          </CardContent>
        </Card>

        {Object.entries(categoryTotals).slice(0, 2).map(([cat, total]) => (
          <Card key={cat}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-surface-400" />
                <span className="text-xs text-surface-500">{CATEGORY_LABELS[cat as ExpenseCategory]}</span>
              </div>
              <p className="font-display font-bold text-lg text-surface-900 dark:text-surface-100">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      {expenses.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Description"
                placeholder="e.g. Monthly Rent"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                label="Amount ($)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <Input
                label="Notes (optional)"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No expenses yet</h3>
            <p className="text-sm text-surface-500 mb-6">Start tracking your store expenses</p>
            <Button onClick={openAdd}><Plus size={16} />Add Expense</Button>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-surface-400 text-sm">No expenses matching "{search}"</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <TrendingDown size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[expense.category]}`}>
                        {CATEGORY_LABELS[expense.category]}
                      </span>
                      <span className="text-xs text-surface-400">{formatDate(expense.created_at)}</span>
                    </div>
                    {expense.notes && (
                      <p className="text-xs text-surface-400 mt-0.5 truncate">{expense.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-red-600 text-sm">{formatCurrency(expense.amount)}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(expense)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        disabled={deletingId === expense.id}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deletingId === expense.id
                          ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
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