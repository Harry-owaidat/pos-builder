# 🏪 POS Builder — Multi-Tenant POS Platform

A complete SaaS platform to build and manage POS systems for restaurants, pharmacies, and retail stores.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
4. Go to **Project Settings → API** and copy your URL and anon key

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   ├── register/page.tsx       # Register
│   │   └── callback/route.ts       # Email confirm callback
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   └── page.tsx                # Dashboard overview
│   └── store/[id]/
│       ├── pos/page.tsx            # POS Terminal
│       └── products/page.tsx       # Product Management
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── dashboard/                  # Dashboard components
│   └── pos/                        # POS components
├── lib/
│   ├── supabase/                   # Supabase clients
│   └── utils.ts                    # Utilities
└── types/
    └── index.ts                    # TypeScript types
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `stores` | Each tenant's store (linked to auth user) |
| `products` | Products per store |
| `sales` | Completed sales transactions |
| `sale_items` | Line items per sale |

---

## 🔑 Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/register` | Create account |
| `/dashboard` | Store overview & builder |
| `/store/[id]/pos` | POS cashier terminal |
| `/store/[id]/products` | Product management |

---

## 🔒 Security

- Row Level Security (RLS) on all tables
- Each user can only access their own data
- Auth handled by Supabase Auth

---

## 🛠 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL + RLS)
