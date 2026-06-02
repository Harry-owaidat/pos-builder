'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { StoreType, Theme } from '@/types'

export function CreateStoreModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<StoreType>('retail')
  const [theme, setTheme] = useState<Theme>('light')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('stores').insert({
        name: name.trim(),
        type,
        theme,
        user_id: user.id,
      })

      if (insertError) {
        setError(insertError.message)
      } else {
        setOpen(false)
        setName('')
        setType('retail')
        setTheme('light')
        router.refresh()
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="md">
        <Plus size={16} />
        New Store
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-surface-100 dark:border-surface-800 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">Create New Store</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Store Name" placeholder="e.g. My Burger Joint" value={name} onChange={(e) => setName(e.target.value)} required />
              <Select label="Business Type" value={type} onChange={(e) => setType(e.target.value as StoreType)} options={[
                { value: 'restaurant', label: '🍽️ Restaurant' },
                { value: 'pharmacy', label: '💊 Pharmacy' },
                { value: 'retail', label: '🛍️ Retail Store' },
              ]} />
              <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as Theme)} options={[
                { value: 'light', label: '☀️ Light Theme' },
                { value: 'dark', label: '🌙 Dark Theme' },
              ]} />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={loading}>Create Store</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}