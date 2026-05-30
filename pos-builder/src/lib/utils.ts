import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export const STORE_TYPE_LABELS = {
  restaurant: 'Restaurant 🍽️',
  pharmacy: 'Pharmacy 💊',
  retail: 'Retail Store 🛍️',
} as const

export const STORE_TYPE_ICONS = {
  restaurant: '🍽️',
  pharmacy: '💊',
  retail: '🛍️',
} as const
