@AGENTS.md

# Lomissa — Photography Marketplace

A luxury photography booking platform connecting clients with curated photographers worldwide. Clients browse, book, and pay; photographers manage portfolios, packages, and availability; admins curate the supply side and resolve disputes.

Live at **lomissa.com** — deployed on Vercel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 — App Router |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Payments | Stripe Connect (`@stripe/stripe-js` 9 + `stripe` 22) |
| Images | Cloudinary |
| Email | Resend (from: hello@lomissa.com) |

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint 9
```

---

## Features Built

**Client-facing**
- Browse and filter photographers (`/photographers`)
- Photographer profile with packages, add-ons, portfolio gallery, reviews, availability calendar (`/photographers/[id]`)
- Stripe Checkout booking flow (package + add-ons, line-item receipt)
- Client dashboard: booking cards with full status lifecycle, cancel button, dispute button, review prompt (`/dashboard`)
- Messaging: per-booking conversation threads with real-time feel, WhatsApp-style conversation hiding (`/messages`, `/messages/[bookingId]`)
- Leave a review after session completes (`/review/[bookingId]`)
- GDPR account deletion: 30-day grace period, full refunds on active bookings, cancel-deletion option (`/dashboard` → Account settings)

**Photographer-facing**
- Photographer dashboard: overview tab with stats, earnings summary, setup checklist (`/photographer-dashboard`)
- Portfolio manager: upload/reorder/delete photos (`/photographer-dashboard/portfolio`)
- Package builder: create packages with duration, photo count, price; add-ons with per-unit pricing (`/photographer-dashboard/packages`)
- Availability manager: block dates calendar (`/photographer-dashboard/availability`)
- Edit profile: bio, location, specialty, cancellation policy, session terms (`/photographer-dashboard/edit-profile`)
- Stripe Connect onboarding via Express accounts; payout-setup-complete confirmation page
- Earnings page: real-time Stripe balance + payout history (`/photographer-dashboard` earnings tab)
- Mark photos delivered, triggering 7-day dispute window and eventual auto-payout
- GDPR account deletion (same 30-day flow)

**Admin-facing** (`/admin`)
- Stats overview: total photographers, clients, bookings, revenue
- Photographers tab: approve/reject applications, view profiles, manage active photographers
- Clients tab: list all clients with join date, booking count, deletion status
- Bookings tab: full booking list with filters, booking detail view
- Dispute resolution: release payment to photographer or refund client

**Auth**
- Email/password signup with role assignment (client vs photographer)
- Email confirmation via Supabase (`/auth/confirm`)
- Password reset + update flows
- Photographer application form (`/signup`) → pending approval page (`/pending`)
- Studio access gate (`/studio-access`)

**Automated (cron)**
- Daily 9 AM: confirm→completed for past-date sessions; auto-release payouts after 7-day dispute window
- Daily 10 AM: process account deletions (anonymize PII, delete auth user)

---

## Project Structure

```
app/
  page.tsx                              # Home / hero
  layout.tsx                            # Root layout (fonts, metadata)
  photographers/
    page.tsx                            # Browse photographers
    [id]/page.tsx                       # Photographer profile + booking
  dashboard/page.tsx                    # Client dashboard
  messages/
    page.tsx                            # Conversations list
    [bookingId]/page.tsx                # Individual conversation
  review/[bookingId]/page.tsx           # Leave a review
  photographer-dashboard/
    page.tsx                            # Photographer overview + earnings
    portfolio/page.tsx
    packages/page.tsx
    availability/page.tsx
    edit-profile/page.tsx
    payout-setup-complete/page.tsx
  admin/page.tsx                        # Admin panel (all tabs)
  join/page.tsx                         # Photographer application
  pending/page.tsx                      # Post-application waiting page
  studio-access/page.tsx
  login/ signup/ reset-password/ update-password/
  auth/confirm/                         # Supabase email confirm callback
  terms/page.tsx
  privacy/page.tsx
  api/
    create-payment/route.ts             # Stripe Checkout session
    stripe-webhook/route.ts             # Webhook: payment confirmed
    stripe-connect/
      onboarding-link/route.ts          # Generate Express onboarding URL
      callback/route.ts                 # Mark onboarding complete
    cancel-booking/route.ts             # Cancel + conditional refund
    mark-photos-delivered/route.ts      # Trigger 7-day payout window
    raise-dispute/route.ts              # Client dispute within window
    admin-resolve-dispute/route.ts      # Admin: release or refund
    approve-photographer/route.ts       # Admin: approve/reject application
    photographer-earnings/route.ts      # Stripe balance + payout history
    upload/route.ts                     # Cloudinary image upload
    send-email/route.ts                 # Transactional email (Resend)
    request-deletion/route.ts           # GDPR: initiate 30-day deletion
    cancel-deletion/route.ts            # GDPR: cancel pending deletion
    admin/
      clients/route.ts                  # List all client users
    cron/
      release-payouts/route.ts          # Daily: complete sessions + release payouts
      process-deletions/route.ts        # Daily: anonymize + delete accounts
  components/
    Logo.tsx                            # SVG logo (sunburst, finalized)
    BfcacheRefresh.tsx                  # Bfcache workaround
lib/
  supabase.ts                           # Singleton anon client
```

---

## Database Schema

All tables live in Supabase (PostgreSQL). RLS is enabled; service-role client bypasses it in API routes.

### `bookings`
Core transaction record. Snapshots freeze pricing/terms at booking time.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `client_id` | uuid | auth.users ref (no FK — intentional for deletion) |
| `client_name` | text | |
| `client_email` | text | |
| `photographer_id` | uuid | auth.users ref |
| `photographer_name` | text | |
| `photographer_email` | text | |
| `status` | text | see lifecycle below |
| `session_type` | text | package name at time of booking |
| `date` | date | session date |
| `location` | text | |
| `message` | text | client's initial message |
| `price` | text | display string e.g. "5 000 NOK" |
| `stripe_payment_intent_id` | text | |
| `stripe_transfer_id` | text | set when payout released |
| `cancellation_policy_snapshot` | text | flexible/moderate/strict — frozen at booking |
| `terms_snapshot` | jsonb | delivery_time, copyright, editing, revisions |
| `package_snapshot` | jsonb | full package record at booking time |
| `addons_snapshot` | jsonb | array of selected add-ons with quantities |
| `photos_delivered_at` | timestamptz | |
| `payout_due_at` | timestamptz | photos_delivered_at + 7 days |
| `payout_released_at` | timestamptz | |
| `dispute_raised_at` | timestamptz | |
| `dispute_reason` | text | |
| `admin_note` | text | admin resolution note |
| `created_at` | timestamptz | |

### `photographers`
One row per approved photographer, linked to auth user.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `user_id` | auth.users FK |
| `name`, `email` | |
| `location`, `specialty`, `bio` | |
| `profile_photo` | Cloudinary URL |
| `instagram`, `website` | |
| `stripe_account_id` | Express account ID |
| `stripe_onboarding_completed` | boolean |
| `cancellation_policy` | flexible/moderate/strict |
| `delivery_time`, `copyright_ownership`, `editing_style`, `revisions_included` | session terms |
| `created_at` | |

### `photographer_packages`
Each photographer has multiple packages.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `photographer_id` | FK → photographers.id |
| `name` | e.g. "Golden Hour Session" |
| `duration` | e.g. "2 hours" |
| `photos_delivered` | integer |
| `price` | integer (minor currency units) |
| `description` | optional |

### `photographer_addons`
Optional extras clients can add at booking.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `photographer_id` | FK → photographers.id |
| `name` | e.g. "Extra hour" |
| `price` | integer |
| `unit` | e.g. "per hour", "per photo" |

### `portfolio_photos`
| Column | Notes |
|--------|-------|
| `id` | PK |
| `photographer_id` | FK → photographers.id |
| `url` | Cloudinary URL |
| `order` | display order |

### `messages`
Per-booking conversation threads.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `booking_id` | FK → bookings.id |
| `sender_id` | auth.users ref |
| `receiver_id` | auth.users ref |
| `text` | message body |
| `read` | boolean |
| `created_at` | |

### `conversation_deletions`
WhatsApp-style per-user conversation hiding (the conversation still exists for the other party).

| Column | Notes |
|--------|-------|
| `user_id` | auth.users ref |
| `booking_id` | FK → bookings.id |
| `deleted_at` | |

### `reviews`
Client reviews submitted after session completion.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `booking_id` | FK → bookings.id |
| `client_id` | auth.users ref |
| `photographer_id` | auth.users ref |
| `rating` | integer 1–5 |
| `comment` | text |
| `created_at` | |

### `account_deletion_requests`
GDPR deletion queue with 30-day grace period.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `user_id` | auth.users ref (CASCADE DELETE) |
| `user_email` | stored for post-deletion audit |
| `user_role` | client/photographer |
| `status` | pending/cancelled/completed |
| `requested_at` | |
| `scheduled_deletion_at` | requested_at + 30 days |
| `cancelled_at` | nullable |
| `completed_at` | nullable |

Partial unique index on `(user_id) WHERE status = 'pending'` — prevents duplicate active requests while allowing re-request after cancellation.

RLS policies: `select_own`, `insert_own`, `update_own_pending` (cancel only).

### `admin_users`
Simple email allowlist for admin access.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `email` | checked against auth user on every admin API call |

### `applications`
Photographer signup applications (pre-approval).

| Column | Notes |
|--------|-------|
| `id` | PK |
| `name`, `email`, `location`, `specialty` | |
| `portfolio_link`, `about` | |
| `status` | pending/approved/rejected |
| `created_at` | |

---

## Booking Lifecycle

```
awaiting_payment
    │ Client completes Stripe Checkout
    ▼
pending               ← photographer sees new booking request
    │ Photographer accepts
    ▼
confirmed             ← both parties committed
    │ Session date passes (cron, daily 9 AM)
    ▼
completed             ← session done
    │ Photographer uploads + marks photos delivered
    ▼
photos_delivered      ← 7-day dispute window opens (payout_due_at set)
    │ No dispute raised AND payout_due_at passes (cron, daily 9 AM)
    ▼
paid_out              ← Stripe transfer sent, booking closed
```

**Dispute branch:**
```
photos_delivered → [client raises dispute within 7 days] → disputed
disputed → [admin releases payment] → paid_out
disputed → [admin issues refund]    → cancelled
```

**Cancellation rules:**

| Who cancels | Booking status | Refund |
|-------------|---------------|--------|
| Client | pending | Full refund |
| Client | confirmed | flexible: refund if >24 h before session; moderate: >48 h; strict: no refund |
| Photographer | confirmed | Full refund to client |
| Either (account deletion) | pending or confirmed | Full refund always |

---

## Payment Flow (Stripe Connect)

1. **Photographer onboarding** — `POST /api/stripe-connect/onboarding-link` creates a Stripe Express account and returns an onboarding URL. After completion, `GET /api/stripe-connect/callback` sets `stripe_onboarding_completed = true`.

2. **Client books** — `POST /api/create-payment`:
   - Validates package + add-ons server-side (price computed server-side, never trusted from client)
   - Inserts booking with `status: "awaiting_payment"`
   - Creates Stripe Checkout session with `transfer_group: booking.id` and line items matching the booking breakdown
   - Returns Checkout URL; client is redirected

3. **Payment confirmed** — `POST /api/stripe-webhook` (event: `checkout.session.completed`):
   - Stores `stripe_payment_intent_id` on booking
   - Transitions `awaiting_payment → pending`
   - Sends booking request email to photographer

4. **Payout release** — `GET /api/cron/release-payouts` (daily, 9 AM UTC):
   - `stripe.transfers.create({ amount: total - 10%, destination: stripe_account_id, transfer_group: booking.id, source_transaction: latest_charge })`
   - Stores `stripe_transfer_id`, sets `payout_released_at`, transitions → `paid_out`

**Commission: 10% platform fee.** Photographer receives 90% of the charged amount. The platform retains the 10% on the payment intent — no separate charge is created.

---

## Business Model

- **Commission:** 10% on every completed booking
- **No subscription fees** for photographers
- **Curated supply:** photographers apply via `/signup`, admin approves
- **Escrow model:** funds held on Stripe until 7 days after photo delivery — protects clients while ensuring photographer is paid promptly if no dispute
- **Dispute resolution:** admin-mediated; admin can either release to photographer or refund client

---

## Key API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/create-payment` | Client bearer | Create Checkout session |
| POST | `/api/stripe-webhook` | Stripe signature | Payment confirmed handler |
| POST | `/api/stripe-connect/onboarding-link` | Photographer bearer | Generate Stripe Connect URL |
| GET | `/api/stripe-connect/callback` | — | Mark onboarding complete |
| POST | `/api/cancel-booking` | Client or photographer bearer | Cancel + conditional refund |
| POST | `/api/mark-photos-delivered` | Photographer bearer | Trigger dispute window |
| POST | `/api/raise-dispute` | Client bearer | Open dispute within 7 days |
| POST | `/api/admin-resolve-dispute` | Admin bearer | Release or refund |
| POST | `/api/approve-photographer` | Admin bearer | Approve/reject application |
| GET | `/api/photographer-earnings` | Photographer bearer | Stripe balance + history |
| POST | `/api/upload` | Bearer | Cloudinary upload |
| POST | `/api/send-email` | Bearer | Transactional email |
| POST | `/api/request-deletion` | Bearer | GDPR deletion request |
| POST | `/api/cancel-deletion` | Bearer | Cancel pending deletion |
| GET | `/api/admin/clients` | Admin bearer | List all clients |
| GET | `/api/cron/release-payouts` | `CRON_SECRET` | Daily payout cron |
| GET | `/api/cron/process-deletions` | `CRON_SECRET` | Daily deletion cron |

---

## Environment Variables

### Public (safe to expose)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_BASE_URL            # e.g. https://lomissa.com
```

### Secret (server-only)
```
SUPABASE_SERVICE_ROLE_KEY       # required for auth.admin.listUsers + RLS bypass
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET           # Stripe webhook signature verification
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
CRON_SECRET                     # Bearer token for /api/cron/* endpoints
```

---

## Deployment

- **Host:** Vercel (production)
- **Domain:** lomissa.com
- **Cron jobs:** defined in `vercel.json` — Vercel runs them on schedule, passing `Authorization: Bearer ${CRON_SECRET}`

```json
{
  "crons": [
    { "path": "/api/cron/release-payouts",   "schedule": "0 9 * * *"  },
    { "path": "/api/cron/process-deletions", "schedule": "0 10 * * *" }
  ]
}
```

- **Environment variables:** set in Vercel project settings (not in `.env.local` on the server)
- **Supabase project:** production instance; no separate staging DB

---

## Design System

### Aesthetic
Luxury editorial — warm parchment backgrounds, serif headlines, generous whitespace. Inspired by high-end editorial photography and fashion magazines.

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| Terracotta | `#B85528` | Primary brand accent, CTAs |
| Terracotta light | `#C4907A` | Secondary labels, borders |
| Cream | `#FAF7F1` | Page backgrounds |
| Off-white | `#FAFAF8` | Card backgrounds, email backgrounds |
| Dark brown | `#1C1009` | Primary text |
| Near-black | `#1a1a1a` | Email headings |

### Typography
Fonts loaded via `<link>` in `app/layout.tsx` (Google Fonts). **Do not use `next/font`.**

| Font | Weights | Use |
|------|---------|-----|
| Cormorant Garamond | 300–700, italic | Display headings, hero |
| Fraunces | 400–500, italic, optical-size 9–144 | Sub-headings, editorial |
| Jost | 300–700 | Body text, UI labels, navigation |

### Logo
SVG in `app/components/Logo.tsx`. Sunburst icon at `translate(174, 30)` with 5pt circle and 5 rays. Finalized — do not adjust transform values.

### Tailwind
Tailwind CSS 4 — config via `globals.css`. Use utility classes directly; no component library.

---

## Key Conventions

- **Supabase client:** import from `@/lib/supabase` for anon client. API routes that need elevated access create a service-role client inline: `createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)`. Never use a module-level service client — create it inside the handler so env vars resolve correctly.
- **Auth pattern in API routes:** extract bearer token from `Authorization` header → verify with anon client's `auth.getUser(token)` → then use service client for DB operations.
- **Admin auth:** after verifying user, query `admin_users` table by email to confirm admin status.
- **Cron auth:** check `Authorization: Bearer ${CRON_SECRET}` header. Return 401 if missing or wrong.
- **Prices:** stored as integers (minor currency units) in the DB; displayed as formatted strings (e.g. `"5 000 NOK"`). Price is computed server-side in `/api/create-payment` — never trust client-supplied totals.
- **Snapshots:** when a booking is created, package details, add-ons, and cancellation policy are frozen into `*_snapshot` JSONB columns. Never re-query live package data to evaluate an existing booking.
- **Images:** upload to Cloudinary via `POST /api/upload`; store the returned URL in Supabase.
- **API routes:** all under `app/api/*/route.ts`, named exports (`GET`, `POST`, etc.) per Next.js App Router convention.
- **Email sender:** always `Lomissa <hello@lomissa.com>`.
