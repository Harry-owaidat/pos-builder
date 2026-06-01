'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, X, ShoppingCart, Pencil, Search, ChevronDown, ChevronUp, Phone, Mail, Building, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, Supplier, SupplierInvoice, InvoiceStatus } from '@/types'
import { STORE_TYPE_ICONS, formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface SupplierWithInvoices extends Supplier {
  supplier_invoices: SupplierInvoice[]
}

interface Props {
  store: Store
  initialSuppliers: SupplierWithInvoices[]
}

interface SupplierForm {
  name: string
  company: string
  phone: string
  email: string
  notes: string
}

interface InvoiceForm {
  invoice_number: string
  total_amount: string
  paid_amount: string
  due_date: string
  notes: string
}

const emptySupplierForm: SupplierForm = { name: '', company: '', phone: '', email: '', notes: '' }
const emptyInvoiceForm: InvoiceForm = { invoice_number: '', total_amount: '', paid_amount: '0', due_date: '', notes: '' }

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  partial: { label: 'Partial', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  unpaid: { label: 'Unpaid', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

function getInvoiceStatus(total: number, paid: number): InvoiceStatus {
  if (paid >= total) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

export function SuppliersManager({ store, initialSuppliers }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierWithInvoices[]>(initialSuppliers)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Supplier form
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm)
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierError, setSupplierError] = useState('')

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState<string | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null)
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.company && s.company.toLowerCase().includes(search.toLowerCase()))
  )

  const totalDebt = suppliers.reduce((sum, s) =>
    sum + s.supplier_invoices.reduce((a, inv) => a + (inv.total_amount - inv.paid_amount), 0), 0
  )

  // Supplier CRUD
  function openAddSupplier() {
    setEditingSupplier(null)
    setSupplierForm(emptySupplierForm)
    setSupplierError('')
    setShowSupplierForm(true)
  }

  function openEditSupplier(supplier: Supplier) {
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      company: supplier.company || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      notes: supplier.notes || '',
    })
    setSupplierError('')
    setShowSupplierForm(true)
  }

  async function handleSupplierSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSupplierLoading(true)
    setSupplierError('')
    const supabase = createClient()

    if (editingSupplier) {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          name: supplierForm.name.trim(),
          company: supplierForm.company.trim() || null,
          phone: supplierForm.phone.trim() || null,
          email: supplierForm.email.trim() || null,
          notes: supplierForm.notes.trim() || null,
        })
        .eq('id', editingSupplier.id)
        .select()
        .single()

      if (error) {
        setSupplierError(error.message)
      } else {
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...s, ...data } : s))
        setShowSupplierForm(false)
      }
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          store_id: store.id,
          name: supplierForm.name.trim(),
          company: supplierForm.company.trim() || null,
          phone: supplierForm.phone.trim() || null,
          email: supplierForm.email.trim() || null,
          notes: supplierForm.notes.trim() || null,
        })
        .select()
        .single()

      if (error) {
        setSupplierError(error.message)
      } else {
        setSuppliers(prev => [{ ...data as Supplier, supplier_invoices: [] }, ...prev])
        setShowSupplierForm(false)
      }
    }
    setSupplierLoading(false)
  }

  async function handleDeleteSupplier(supplierId: string) {
    if (!confirm('Delete this supplier and all their invoices?')) return
    setDeletingId(supplierId)
    const supabase = createClient()
    await supabase.from('suppliers').delete().eq('id', supplierId)
    setSuppliers(prev => prev.filter(s => s.id !== supplierId))
    setDeletingId(null)
  }

  // Invoice CRUD
  function openAddInvoice(supplierId: string) {
    setEditingInvoice(null)
    setInvoiceForm(emptyInvoiceForm)
    setInvoiceError('')
    setShowInvoiceForm(supplierId)
  }

  function openEditInvoice(invoice: SupplierInvoice) {
    setEditingInvoice(invoice)
    setInvoiceForm({
      invoice_number: invoice.invoice_number || '',
      total_amount: String(invoice.total_amount),
      paid_amount: String(invoice.paid_amount),
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
    })
    setInvoiceError('')
    setShowInvoiceForm(invoice.supplier_id)
  }

  async function handleInvoiceSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInvoiceLoading(true)
    setInvoiceError('')

    const total = parseFloat(invoiceForm.total_amount)
    const paid = parseFloat(invoiceForm.paid_amount)

    if (isNaN(total) || total <= 0) {
      setInvoiceError('Invalid total amount')
      setInvoiceLoading(false)
      return
    }

    const status = getInvoiceStatus(total, paid || 0)
    const supabase = createClient()

    if (editingInvoice) {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .update({
          invoice_number: invoiceForm.invoice_number.trim() || null,
          total_amount: total,
          paid_amount: paid || 0,
          due_date: invoiceForm.due_date || null,
          status,
          notes: invoiceForm.notes.trim() || null,
        })
        .eq('id', editingInvoice.id)
        .select()
        .single()

      if (error) {
        setInvoiceError(error.message)
      } else {
        setSuppliers(prev => prev.map(s => s.id === editingInvoice.supplier_id
          ? { ...s, supplier_invoices: s.supplier_invoices.map(inv => inv.id === editingInvoice.id ? data as SupplierInvoice : inv) }
          : s
        ))
        setShowInvoiceForm(null)
        setEditingInvoice(null)
      }
    } else {
      const supplierId = showInvoiceForm!
      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          supplier_id: supplierId,
          store_id: store.id,
          invoice_number: invoiceForm.invoice_number.trim() || null,
          total_amount: total,
          paid_amount: paid || 0,
          due_date: invoiceForm.due_date || null,
          status,
          notes: invoiceForm.notes.trim() || null,
        })
        .select()
        .single()

      if (error) {
        setInvoiceError(error.message)
      } else {
        setSuppliers(prev => prev.map(s => s.id === supplierId
          ? { ...s, supplier_invoices: [data as SupplierInvoice, ...s.supplier_invoices] }
          : s
        ))
        setShowInvoiceForm(null)
      }
    }
    setInvoiceLoading(false)
  }

  async function handleDeleteInvoice(invoice: SupplierInvoice) {
    if (!confirm('Delete this invoice?')) return
    const supabase = createClient()
    await supabase.from('supplier_invoices').delete().eq('id', invoice.id)
    setSuppliers(prev => prev.map(s => s.id === invoice.supplier_id
      ? { ...s, supplier_invoices: s.supplier_invoices.filter(inv => inv.id !== invoice.id) }
      : s
    ))
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
            <p className="text-sm text-surface-500">Suppliers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/store/${store.id}/pos`}>
            <Button variant="outline" size="sm"><ShoppingCart size={14} />Open POS</Button>
          </Link>
          <Button onClick={openAddSupplier} size="sm"><Plus size={14} />Add Supplier</Button>
        </div>
      </div>

      {/* Total Debt */}
      {totalDebt > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Total Outstanding Debt</span>
          </div>
          <span className="font-display font-bold text-red-600 text-lg">{formatCurrency(totalDebt)}</span>
        </div>
      )}

      {/* Search */}
      {suppliers.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSupplierForm(false)} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={() => setShowSupplierForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSupplierSubmit} className="space-y-3">
              <Input label="Name *" placeholder="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="Company" placeholder="Company name" value={supplierForm.company} onChange={(e) => setSupplierForm(f => ({ ...f, company: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" placeholder="+1234567890" value={supplierForm.phone} onChange={(e) => setSupplierForm(f => ({ ...f, phone: e.target.value }))} />
                <Input label="Email" type="email" placeholder="supplier@email.com" value={supplierForm.email} onChange={(e) => setSupplierForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <Input label="Notes" placeholder="Additional notes..." value={supplierForm.notes} onChange={(e) => setSupplierForm(f => ({ ...f, notes: e.target.value }))} />
              {supplierError && <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{supplierError}</div>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowSupplierForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={supplierLoading}>{editingSupplier ? 'Save' : 'Add Supplier'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowInvoiceForm(null); setEditingInvoice(null) }} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
              </h2>
              <button onClick={() => { setShowInvoiceForm(null); setEditingInvoice(null) }} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInvoiceSubmit} className="space-y-3">
              <Input label="Invoice Number" placeholder="INV-001" value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm(f => ({ ...f, invoice_number: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total Amount *" type="number" step="0.01" min="0" placeholder="0.00" value={invoiceForm.total_amount} onChange={(e) => setInvoiceForm(f => ({ ...f, total_amount: e.target.value }))} required />
                <Input label="Paid Amount" type="number" step="0.01" min="0" placeholder="0.00" value={invoiceForm.paid_amount} onChange={(e) => setInvoiceForm(f => ({ ...f, paid_amount: e.target.value }))} />
              </div>
              <Input label="Due Date" type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm(f => ({ ...f, due_date: e.target.value }))} />
              <Input label="Notes" placeholder="Additional notes..." value={invoiceForm.notes} onChange={(e) => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} />
              {invoiceError && <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{invoiceError}</div>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowInvoiceForm(null); setEditingInvoice(null) }}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={invoiceLoading}>{editingInvoice ? 'Save' : 'Add Invoice'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      {suppliers.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🏭</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No suppliers yet</h3>
            <p className="text-sm text-surface-500 mb-6">Add your first supplier to track invoices</p>
            <Button onClick={openAddSupplier}><Plus size={16} />Add Supplier</Button>
          </CardContent>
        </Card>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 text-surface-400 text-sm">No suppliers matching "{search}"</div>
      ) : (
        <div className="space-y-3">
          {filteredSuppliers.map((supplier) => {
            const totalInvoices = supplier.supplier_invoices.reduce((a, inv) => a + inv.total_amount, 0)
            const totalPaid = supplier.supplier_invoices.reduce((a, inv) => a + inv.paid_amount, 0)
            const totalDue = totalInvoices - totalPaid
            const isExpanded = expandedId === supplier.id

            return (
              <Card key={supplier.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Supplier Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {supplier.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 dark:text-surface-100">{supplier.name}</p>
                      {supplier.company && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building size={11} className="text-surface-400" />
                          <span className="text-xs text-surface-500">{supplier.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={11} className="text-surface-400" />
                            <span className="text-xs text-surface-500">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail size={11} className="text-surface-400" />
                            <span className="text-xs text-surface-500 truncate">{supplier.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {totalDue > 0 && (
                        <p className="text-sm font-bold text-red-600">{formatCurrency(totalDue)} due</p>
                      )}
                      {totalDue === 0 && totalInvoices > 0 && (
                        <p className="text-sm font-bold text-emerald-600">All paid ✓</p>
                      )}
                      <p className="text-xs text-surface-400">{supplier.supplier_invoices.length} invoice{supplier.supplier_invoices.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => openEditSupplier(supplier)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        disabled={deletingId === supplier.id}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : supplier.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Invoices */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Invoices</p>
                        <button
                          onClick={() => openAddInvoice(supplier.id)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                        >
                          <Plus size={12} />Add Invoice
                        </button>
                      </div>

                      {supplier.supplier_invoices.length === 0 ? (
                        <div className="text-center py-6 text-surface-400 text-sm">
                          No invoices yet —
                          <button onClick={() => openAddInvoice(supplier.id)} className="text-brand-600 hover:text-brand-700 ml-1 font-medium">add one</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {supplier.supplier_invoices.map((invoice) => {
                            const remaining = invoice.total_amount - invoice.paid_amount
                            const statusConfig = STATUS_CONFIG[invoice.status]
                            const StatusIcon = statusConfig.icon

                            return (
                              <div key={invoice.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusConfig.bg}`}>
                                  <StatusIcon size={15} className={statusConfig.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {invoice.invoice_number && (
                                      <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">#{invoice.invoice_number}</span>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-surface-500">Total: {formatCurrency(invoice.total_amount)}</span>
                                    <span className="text-xs text-emerald-600">Paid: {formatCurrency(invoice.paid_amount)}</span>
                                    {remaining > 0 && <span className="text-xs text-red-600">Due: {formatCurrency(remaining)}</span>}
                                  </div>
                                  {invoice.due_date && (
                                    <p className="text-xs text-surface-400 mt-0.5">Due: {invoice.due_date}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => openEditInvoice(invoice)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors">
                                    <Pencil size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteInvoice(invoice)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}