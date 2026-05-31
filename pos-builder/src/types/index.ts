export type StoreType = 'restaurant' | 'pharmacy' | 'retail'
export type Theme = 'light' | 'dark'
export type PaymentMethod = 'cash' | 'card' | 'qr'
export type MemberRole = 'admin' | 'cashier'
export type MemberStatus = 'pending' | 'active'

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
  created_at: string
}

export interface CartItem {
  product: Product
  qty: number
}