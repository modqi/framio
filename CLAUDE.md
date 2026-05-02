@AGENTS.md

# Lomissa — Photography Marketplace

A luxury photography booking platform connecting clients with curated photographers worldwide. Clients browse, book, and pay; photographers manage portfolios and availability; admins approve new photographers.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 — App Router |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Database / Auth | Supabase (PostgreSQL) |
| Payments | Stripe (`@stripe/stripe-js` 9 + `stripe` 22) |
| Images | Cloudinary |
| Email | Resend |

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint 9
```

## Project Structure

```
app/
  page.tsx                        # Home / hero
  layout.tsx                      # Root layout (fonts, metadata)
  photographers/
    page.tsx                      # Browse photographers
    [id]/page.tsx                 # Photographer profile + booking
  dashboard/page.tsx              # Client dashboard (bookings)
  messages/
    page.tsx                      # Conversations list
    [bookingId]/page.tsx          # Individual conversation
  review/[bookingId]/page.tsx     # Leave a review
  photographer-dashboard/
    page.tsx                      # Photographer overview
    portfolio/page.tsx
    availability/page.tsx
    edit-profile/page.tsx
  admin/page.tsx                  # Admin panel
  join/page.tsx                   # Photographer application
  login/ signup/ reset-password/ update-password/ pending/
  auth/confirm/                   # Supabase email confirm callback
  studio-access/page.tsx
  api/
    create-payment/route.ts       # Stripe payment intent
    upload/route.ts               # Cloudinary image upload
    send-email/route.ts           # Resend transactional email
    approve-photographer/route.ts # Admin approval flow
  components/
    Logo.tsx
lib/
  supabase.ts                     # Supabase client (anon key)
```

## Key Conventions

- **Supabase client**: import from `@/lib/supabase`. There is one singleton using the anon key. Server-side routes that need elevated privileges should create a service-role client inline using `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- **API routes**: all under `app/api/*/route.ts`, named exports (`GET`, `POST`, etc.) per Next.js App Router convention.
- **Fonts**: loaded via `<link>` tags in `app/layout.tsx` (Google Fonts — Cormorant Garamond + Jost). Do not use `next/font`.
- **Styling**: Tailwind CSS 4. Brand colors: `#B85528` (terracotta), `#FAF7F1` (cream), `#1C1009` (dark brown).
- **Images**: upload to Cloudinary via `POST /api/upload`; store the returned URL in Supabase.
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CLOUDINARY_*`, `RESEND_API_KEY`.
