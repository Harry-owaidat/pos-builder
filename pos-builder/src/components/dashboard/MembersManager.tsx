'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, X, Users, ShoppingCart, Mail } from 'lucide-react'
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

export function MembersManager({ store, initialMembers }: Props) {
  const [members, setMembers] = useState<StoreMember[]>(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const trimmedEmail = email.trim().toLowerCase()

    // Add to store_members
    const { data, error: memberError } = await supabase
      .from('store_members')
      .insert({
        store_id: store.id,
        invited_email: trimmedEmail,
        role: 'cashier',
        status: 'pending',
      })
      .select()
      .single()

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Send invitation email
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail }),
    })

    if (res.ok) {
      setMembers((prev) => [data as StoreMember, ...prev])
      setEmail('')
      setShowForm(false)
      setSuccess('Invitation sent successfully!')
    } else {
      // Member added but email failed — still show them
      setMembers((prev) => [data as StoreMember, ...prev])
      setEmail('')
      setShowForm(false)
      setSuccess('Cashier added! Ask them to register with this email.')
    }

    setLoading(false)
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId)
    const supabase = createClient()
    const { error } = await supabase.from('store_members').delete().eq('id', memberId)
    if (!error) setMembers((prev) => prev.filter((m) => m.id !== memberId))
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
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={14} />Add Cashier</Button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4">
          ✓ {success}
        </div>
      )}

      {/* Invite Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">Add Cashier</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Cashier Email"
                type="email"
                placeholder="cashier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-surface-500">
                An invitation email will be sent to this address.
              </p>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={loading}>Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-200 mb-2">No cashiers yet</h3>
            <p className="text-sm text-surface-500 mb-6">Add cashiers to your store</p>
            <Button onClick={() => setShowForm(true)}><Plus size={16} />Add Cashier</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Users size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-surface-400" />
                      <span className="font-semibold text-surface-900 dark:text-surface-100 text-sm truncate">
                        {member.invited_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="info">{member.role}</Badge>
                      <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={deletingId === member.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deletingId === member.id
                      ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}