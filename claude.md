@AGENTS.md

# Markd at Work

Internal backend management system for Aditya Gupta garment manufacturing.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **ORM:** Prisma 6
- **Database:** PostgreSQL (Supabase or self-hosted)
- **Auth:** NextAuth.js v4 (credentials-based, JWT)
- **UI:** Tailwind CSS v4
- **Validation:** Zod v4
- **Deploy:** Vercel + Supabase

## Repo Structure

```
prisma/
├── schema.prisma         # Database schema (all models)
├── seed.ts               # Seed script with sample data
src/
├── app/
│   ├── api/
│   │   ├── auth/         # NextAuth + registration
│   │   ├── inventory/    # Finished garment CRUD
│   │   ├── materials/    # Raw material CRUD
│   │   ├── orders/       # Order lifecycle
│   │   ├── stock/        # Stock movement logs
│   │   └── dashboard/    # Aggregated stats
│   ├── (dashboard)/      # Authenticated frontend pages
│   ├── login/            # Login page
│   └── providers.tsx     # SessionProvider wrapper
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   ├── auth.ts           # NextAuth config
│   ├── auth-guard.ts     # requireAuth / requireRole helpers
│   ├── api-utils.ts      # Response helpers, validation, order number gen
│   ├── api-client.ts     # Client-side fetch wrapper
│   └── validations.ts    # Zod schemas for all endpoints
├── middleware.ts          # Route protection via NextAuth
└── types/next-auth.d.ts  # Session type augmentation
```

## Core Data Models

- **User**: id, name, email, hashedPassword, role (ADMIN/MANAGER/WORKER)
- **InventoryItem**: finished garments with SKU, quantity, minStock
- **RawMaterial**: fabric/threads/accessories with cost tracking
- **Order**: customer orders with items, status lifecycle, deadlines
- **OrderItem**: line items linking orders to inventory
- **StockMovement**: inflow/outflow/adjustment logs for both inventory and materials

## Auth & Roles

- ADMIN: full access (CRUD + delete)
- MANAGER: create/update inventory, materials, orders, stock
- WORKER: read access + record stock movements

## Key Commands

```bash
npm run dev              # Start dev server
npm run build            # Generate Prisma + build Next.js
npm run db:push          # Push schema to DB (no migration)
npm run db:migrate       # Run migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio
```

## Conventions

- snake_case for DB table names (via @@map), camelCase in TS code
- Every table has createdAt/updatedAt
- Never hardcode credentials — use .env
- All API responses: `{ success: boolean, data?: ..., error?: string }`
- Zod validation on all POST/PATCH endpoints
- Stock movements use transactions to ensure atomic quantity updates
