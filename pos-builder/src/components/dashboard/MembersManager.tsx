'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, X, ShoppingCart, Mail, Pencil, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store, StoreMember } from '@/types'
import { STORE_TYPE_ICONS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  store: Store
  initialMembers: StoreMember[]
}

interface CashierForm {
  name: string
  email: string
  password: string
}

const emptyForm: CashierForm = { name: '', email: '', password: '' }

export function MembersManager({ store, initialMembers }: Props) {
  const [members, setMembers] = useState<StoreMember[]>(initialMembers)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<StoreMember | null>(null)
  const [form, setForm] = useState<CashierForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredMembers = members.filter(m =>
    m.invited_email.toLowerCase().includes(search.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  )

  function openAdd() {
    setEditingMember(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(member: StoreMember) {
    setEditingMember(member)
    setForm({ name: member.name || '', email: member.invited_email, password: '' })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingMember(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (editingMember) {
      const res = await fetch('/api/cashier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: editingMember.id,
          user_id: editingMember.user_id,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password || undefined,
        }),
      })

      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === editingMember.id
          ? { ...m, name: form.name.trim(), invited_email: form.email.trim().toLowerCase() }
          : m
        ))
        closeForm()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update')
      }
    } else {
      const supabase = createClient()
      const trimmedEmail = form.email.trim().toLowerCase()

      const { data, error: memberError } = await supabase
        .from('store_members')
        .insert({
          store_id: store.id,
          invited_email: trimmedEmail,
          role: 'cashier',
          status: 'active',
          name: form.name.trim(),
        })
        .select()
        .single()

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: form.password,
          name: form.name.trim(),
        }),
      })

      if (res.ok) {
        setMembers(prev => [data as StoreMember, ...prev])
        closeForm()
      } else {
        const result = await res.json()
        setError(result.error || 'Failed to create account')
      }
    }

    setLoading(false)
  }

  async function handleDelete(member: StoreMember) {
    if (!confirm(`Delete ${member.name || member.invited_email}?`)) return
    setDeletingId(member.id)

    const res = await fetch('/api/cashier', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: member.id,
        user_id: member.user_id,
        email: member.invited_email,
      }),
    })

    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== member.id))
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete')
    }

    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{STORE_TYPE_ICONS[store.type]}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">{store.name}</h1>
            <p className="text-sm text-surface-500">Team Members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/store/${store.id}/pos`}>
            <Button variant="outline" size="sm"><ShoppingCart size={14} />Open POS</Button>
          </Link>
          <Button onClick={openAdd} size="sm"><Plus size={14} />Add Cashier</Button>
        </div>
      </div>

      {members.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search cashiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingMember ? 'Edit Cashier' : 'Add Cashier'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" type="text" placeholder="e.g. Ahmed Mohammed" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="Email" type="email" placeholder="cashier@example.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input
                label={editingMember ? 'New Password (leave empty to keep current)' : 'Password'}
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editingMember}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  {editingMember ? 'Save Changes' : 'Add Cashier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No cashiers yet</h3>
            <p className="text-sm text-surface-500 mb-6">Add your first cashier to get started</p>
            <Button onClick={openAdd}><Plus size={16} />Add Cashier</Button>
          </CardContent>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-surface-400 text-sm">No cashiers matching "{search}"</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">
            {filteredMembers.length} cashier{filteredMembers.length !== 1 ? 's' : ''}
          </p>
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(member.name || member.invited_email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{member.name || 'No name'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-surface-400" />
                      <span className="text-xs text-surface-500 truncate">{member.invited_email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="info">{member.role}</Badge>
                      <Badge variant={member.status === 'active' ? 'success' : 'warning'}>{member.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(member)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      disabled={deletingId === member.id}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === member.id
                        ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        : <Trash2 size={14} />
                      }
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