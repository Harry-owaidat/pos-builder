export type StoreType = 'restaurant' | 'pharmacy' | 'retail'
export type Theme = 'light' | 'dark'
export type PaymentMethod = 'cash' | 'card' | 'qr'
export type MemberRole = 'admin' | 'manager' | 'cashier'
export type MemberStatus = 'pending' | 'active'
export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'supplies' | 'other'
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid'

export interface Store {
  id: string
  user_id: string
  name: string
  type: StoreType
  theme: Theme
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  price: number
  stock: number
  category?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  store_id: string
  total: number
  items_count: number
  payment_method: PaymentMethod
  cashier_id?: string
  cashier_email?: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  qty: number
  price: number
  subtotal: number
}

export interface StoreMember {
  id: string
  store_id: string
  user_id: string | null
  role: MemberRole
  invited_email: string
  status: MemberStatus
  name?: string
  created_at: string
}

export interface CartItem {
  product: Product
  qty: number
}

export interface Expense {
  id: string
  store_id: string
  description: string
  amount: number
  category: ExpenseCategory
  notes?: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  store_id: string
  name: string
  company?: string
  phone?: string
  email?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupplierInvoice {
  id: string
  supplier_id: string
  store_id: string
  invoice_number?: string
  total_amount: number
  paid_amount: number
  due_date?: string
  status: InvoiceStatus
  notes?: string
  created_at: string
  updated_at: string
}