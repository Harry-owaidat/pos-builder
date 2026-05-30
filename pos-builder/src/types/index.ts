export type StoreType = 'restaurant' | 'pharmacy' | 'retail'
export type Theme = 'light' | 'dark'

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
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  store_id: string
  total: number
  items_count: number
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

export interface CartItem {
  product: Product
  qty: number
}

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: Store
        Insert: Omit<Store, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_at'>
        Update: Partial<Omit<Sale, 'id' | 'created_at'>>
      }
      sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id' | 'subtotal'>
        Update: never
      }
    }
  }
}
