export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">P</div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">POS Builder</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl shadow-black/40 p-8 border border-surface-100 dark:border-surface-800">
          {children}
        </div>
      </div>
    </div>
  )
}
