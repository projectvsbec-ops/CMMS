# CMMS Architecture Overview

The Campus Maintenance Management System is designed as a monolithic Progressive Web Application tailored for extreme responsiveness, seamless developer experience, and rapid scalability.

## Core Technologies

1. **Next.js 16 (App Router)**
   - Utilizes Server-Side Rendering (SSR) for fast initial loads and Search Engine Optimization.
   - Client-side navigation ensures single-page-application (SPA) feel.
   - Dynamic imports and `React.Suspense` boundaries are used to aggressively code-split charting libraries (Recharts) and heavy interactive tables.

2. **Supabase (Backend-as-a-Service)**
   - **PostgreSQL**: The relational workhorse for all data.
   - **Row Level Security (RLS)**: Enforces authentication rules directly at the database layer.
   - **Realtime / Edge**: Supabase client is utilized for rapid data fetching without the overhead of standard REST APIs.

3. **TanStack Query (React Query)**
   - Global server state management.
   - Handles aggressive local caching, background refetching, and pagination state.
   - Eliminates redundant API calls across Dashboard, Reports, and Lists.

4. **Tailwind CSS & Shadcn/UI**
   - Headless, accessible UI components.
   - Enforces a strict, highly polished design system (Typography, Spacing, Colors) without bloated CSS bundles.

## Directory Structure

- `src/app`: Next.js App Router (Pages, Layouts, Loading, Error Boundaries)
- `src/components`: Reusable UI elements (Shadcn), layout wrappers (Sidebar, Header)
- `src/features`: Domain-driven module architecture. Each feature (e.g. `reports`, `inventory`, `workers`) contains its own `api.ts`, `queries.ts`, and `components/`.
- `src/types`: Global TypeScript definitions matching the database schema.
- `supabase/migrations`: Sequential SQL scripts for spinning up the production database exactly as intended.
