'use client'

import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-surface-900',
            'text-surface-900 dark:text-surface-100 placeholder:text-surface-400',
            'transition-all duration-200 outline-none',
            error
              ? 'border-red-300 dark:border-red-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-400'
              : 'border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
