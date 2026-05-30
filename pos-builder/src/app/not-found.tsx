import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="font-display text-6xl font-bold text-surface-200 dark:text-surface-800 mb-4">404</h1>
      <p className="text-surface-600 dark:text-surface-400 mb-6">Page not found</p>
      <Link href="/dashboard" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
        ← Back to Dashboard
      </Link>
    </div>
  )
}
