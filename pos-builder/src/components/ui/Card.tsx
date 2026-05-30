import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800',
    bordered: 'bg-white dark:bg-surface-900 rounded-2xl border-2 border-surface-200 dark:border-surface-700',
    elevated: 'bg-white dark:bg-surface-900 rounded-2xl shadow-lg shadow-surface-200/50 dark:shadow-black/30',
  }
  return <div className={cn(variants[variant], className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-6 pb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-bold text-surface-900 dark:text-surface-100', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}
