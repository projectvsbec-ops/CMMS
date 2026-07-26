# Campus Maintenance Management System (CMMS)

A production-ready Enterprise Progressive Web Application built for engineering colleges to manage all maintenance activities seamlessly.

## Key Features

- **Master Data**: Full management of Departments, Areas, and Workers.
- **Attendance**: Lightning-fast, mobile-optimized daily attendance logging.
- **Work Allocation**: Manage tasks, track progress, assign workers, and prioritize maintenance.
- **Inventory & Materials**: Complete lifecycle of items with stock_in/stock_out logs and Low Stock tracking.
- **Schedule & Preventive Maintenance**: Create daily schedules and automated recurring jobs (Daily, Weekly, Monthly, etc.).
- **Executive Dashboard**: Real-time KPI charts and business intelligence analytics powered by Recharts.
- **Advanced Reports & Export**: Custom Report Builder capable of flattening and exporting tables securely to `.xlsx`, `.csv` or `Print/PDF`.
- **Global Settings & Data Import**: Real-time notification center, JSON-based global settings schema, and CSV/Excel bulk import.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI/UX**: Tailwind CSS, Shadcn/UI, Lucide Icons
- **State/Caching**: TanStack Query (React Query)
- **Database / Auth**: Supabase (PostgreSQL + RLS Policies)
- **Analytics**: Recharts
- **Export**: SheetJS (xlsx), react-to-print

## Quick Start

1. Install dependencies: `npm install`
2. Create `.env.local` and configure your Supabase URL / Anon Key.
3. Run `npm run dev` to start the local development server.

See the complete [Database Migrations](supabase/migrations) for the exact schema initialization order.
