import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-brand-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="font-display font-bold text-lg tracking-tight">POS Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm text-surface-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          ✦ Multi-Tenant POS Platform
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight max-w-3xl mb-6">
          Build Your POS
          <span className="block text-brand-400">In Minutes</span>
        </h1>

        <p className="text-surface-400 text-lg max-w-xl mb-10 leading-relaxed">
          Launch a full-featured point-of-sale system for your restaurant, pharmacy, or retail store. No code required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-semibold text-base transition-all hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          >
            Start Building Free →
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold text-base transition-all border border-white/10"
          >
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-14">
          {['🍽️ Restaurant POS', '💊 Pharmacy POS', '🛍️ Retail POS', '📊 Sales Analytics', '🛒 Cart System', '🔒 Secure & Multi-tenant'].map(f => (
            <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 text-surface-400 text-xs rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-white/5">
        {[
          { label: 'Store Types', value: '3+' },
          { label: 'Real-time Sync', value: '✓' },
          { label: 'Setup Time', value: '<5min' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center py-6 border-r border-white/5 last:border-0">
            <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-surface-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
