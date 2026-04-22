# CANVUS SYSTEM DEFENSE — Technical Booklet

Version: 1.0
Date: 2026-04-22
Project: Canvus (canvus-shop)

Purpose: This booklet documents the complete system architecture, authentication and authorization flows, wholesale application and ordering logic, database schema considerations, routes and components, role configurations, failure modes and mitigation strategies, and operational guidance for Canvus — a hybrid B2B/B2C e-commerce platform.

Audience: Engineering leads, security reviewers, SREs, product owners, and auditors.

---

## Table of Contents

- Executive Summary
- High-level Architecture
- Key Components and Files
- Authentication & Session Flow
- Role-Based Access Control (Staff & Admin)
- Wholesale Application Flow (UI & Backend)
- Ordering & Fulfillment (WhatsApp Hybrid + MOV)
- Database Schema & Migration Notes
- Routes and Component Map
- Error Handling, Observability & Retry Logic
- Security Controls & Threat Mitigations
- Deployment, Environment & Operational Playbook
- Appendix: Quick File References

---

## Executive Summary

Canvus is a Next.js (App Router) application with Supabase as the backend (auth + Postgres). The platform supports retail shoppers and wholesale partners (schools, resellers). Wholesale onboarding is a vetting flow: applicants submit details, can be reviewed by staff/admin, and once `is_verified_wholesale` and `application_status` are updated to `approved` they gain access to the wholesale portal and bulk-ordering workflows.

Ordering for wholesale uses a hybrid "WhatsApp-first" model: schools use credit/LPO flow (order placed via WhatsApp), resellers use M-Pesa STK push (payment first, then WhatsApp confirmation). The system enforces a Minimum Order Value (MOV) of 5 bulk units.

This document explains every flow, the routes used, the code locations, how edge cases are handled, and recommended operational and security practices.

---

## High-level Architecture

- Frontend: Next.js (App Router). Components under `src/app` and `src/components` implement UI and client behaviors.
- Backend/DB: Supabase (Postgres) for data storage, authentication, RLS, and edge functions where applicable.
- Integrations: WhatsApp (wa.me deep-linking) for order handoff; M-Pesa (placeholder implemented) for reseller payments; inventory and order tracking live in Supabase tables.
- Authentication: Supabase Auth with email confirmation. Auth helper lives in `src/components/auth/auth-provider.tsx`.
- RBAC & Routing: Middleware uses staff profiles and role prefix rules to gate `/admin` and `/rider` routes.

Diagram (conceptual):

Client (Next.js)
  ↕ (Supabase client)
Supabase Auth & Postgres (profiles, staff_profiles, products, orders)
  ↕
Third parties: WhatsApp (wa.me), M-Pesa (STK)

---

## Key Components and Files (overview)

- Authentication & session
  - `src/components/auth/auth-provider.tsx` — central auth context, signup/login/logout, profile insertion.
- Wholesale feature
  - `src/app/wholesale/page.tsx` — wholesale portal UI (product listings, cart, MOV enforcement, WhatsApp message generation).
  - `src/components/wholesale/wholesale-application-form.tsx` — conditional signup/apply UI for retail vs wholesale, school vs business.
  - `src/components/wholesale/wholesaler-locked.tsx` — locked experience and CTA to apply or check status.
  - `src/app/wholesale/status/page.tsx` — application status page for applicants.
  - `src/lib/wholesale-profile.ts` — utilities to fetch profile and check `is_verified_wholesale` and `application_status`.
  - `src/lib/whatsapp.ts` — formatting and opening WhatsApp messages.
  - `supabase/migrations/20260422_wholesale_application_flow.sql` — migration that adds wholesale columns and constraints.
- Admin & staff
  - `middleware.ts` — route guard for staff routes, builds login redirects, resolves staff access via `staff_profiles`.
  - `src/lib/access-control.ts` — role prefixes, home paths, route-access rules (`super_admin`, `store_admin`, `cashier`, `rider`).
  - `src/lib/staff-session.ts` — helper to resolve current staff permissions from session.
- Cart & Ordering
  - `src/components/cart/*` — cart provider and drawer logic.
  - `src/app/checkout/*` and `src/app/cart/page.tsx` — retail checkout logic using WhatsApp for smaller flows.
  - `src/app/wholesale/*` — wholesale cart, MOV enforcement, confirm modal that opens WhatsApp or (placeholder) triggers M-Pesa logic.
- DB schema
  - `supabase/schema.sql`, `supabase/migrations/*` — tables for `profiles`, `staff_profiles`, `products`, `orders`, RLS rules (production-ready schema added previously).

(See Appendix for direct file links.)

---

## Authentication & Session Flow

Source: `src/components/auth/auth-provider.tsx` and `src/lib/supabase.ts`.

1. Signup
   - User submits name, email, phone, password. `signup()` uses `getSupabase().auth.signUp(...)` with `emailRedirectTo` set to the confirmation route.
   - On successful signup, the provider inserts a profile row (in `profiles`) with fields including `account_type`, `institution_name`, `rep_role`, `application_status`, `is_verified_wholesale`.
   - For wholesale accounts, the provider returns a `wholesale_pending` code; UI shows a confirmation screen that explains review & WhatsApp verification.
   - Duplicate profile insertion was fixed so profile data is inserted exactly once.

2. Email confirmation
   - Users must confirm their email before being treated as authenticated. `isEmailConfirmed()` checks `email_confirmed_at` from Supabase user metadata.
   - After confirmation, `AuthProvider` sets `user` to the public representation.

3. Login
   - Login uses `getSupabase().auth.signInWithPassword(...)`; middleware and client code check both user confirmation and staff profile where appropriate.

4. Session refresh & onAuthStateChange
   - `AuthProvider` registers `onAuthStateChange` to maintain client session and update `authReady` state.

Edge cases handled:
- Attempting signup with already-registered email triggers resend or appropriate error codes.
- Profile insert errors are logged but do not fail the signup (fail-open to avoid blocking users; product choice). Consider changing to fail-closed if correctness is critical.

---

## Role-Based Access Control (Staff & Admin)

Core files: `middleware.ts`, `src/lib/access-control.ts`, `src/lib/staff-session.ts`, admin pages under `src/app/admin`.

Roles defined: `super_admin`, `store_admin`, `cashier`, `rider`.

Rules and controls:
- `middleware.ts` intercepts `/admin` and `/rider` routes. It checks session user via Supabase server client and ensures the staff profile (`staff_profiles`) has `is_active = true` and a valid role. If missing, redirect to `/account?denied=staff_required`.
- `ROLE_ROUTE_PREFIXES` maps each role to allowed path prefixes; `canRoleAccessPath()` is the canonical check. If user tries to access a disallowed path, middleware redirects to role home path (from `getHomePathForRole()`).
- `canAccessStore()` enforces store-scoped access (multiple store support), unless `super_admin`.
- Admin UI (`src/app/admin/*`) renders navigation based on `viewerRole` and uses `resolveAccessForCurrentSession()` to set viewer context.

Failure and recovery:
- If staff has been deactivated (`is_active` false), middleware blocks and sends login redirect.
- If email confirmation missing, middleware redirects to login/confirmation flow.

Operational note: staff-role changes take effect on next session check. For instant revocation, clear session cookies or rely on RLS checks on server functions/queries.

---

## Wholesale Application Flow (UI & Backend)

Files: `src/components/wholesale/wholesale-application-form.tsx`, `src/components/wholesale/wholesaler-locked.tsx`, `src/app/wholesale/status/page.tsx`, signup integration in `src/components/auth/auth-provider.tsx`, migration in `supabase/migrations/20260422_wholesale_application_flow.sql`.

Flow (detailed):
1. Entry points
   - Unauthenticated users can visit `/wholesale` and see the locked pitch with an "Apply for Wholesale Account" CTA (`WholesalerLocked`).
   - From `Apply`, the system opens `WholesaleApplicationForm` (multi-step): choose retail vs wholesale; if wholesale, choose school or business; then present conditional fields.

2. Conditional fields
   - School: `School Name`, `Representative Name`, `Role in School` (Bursar, Finance Officer...)
   - Business/Reseller: `Business Name`, `Contact Person`, `Role` (Owner, Manager, Storekeeper...)

3. Submission & UX
   - Submission calls `signup(...)` with `accountType` set to `wholesale_school` or `wholesale_general` and includes `institutionName` and `repRole`.
   - Backend (Supabase insert) sets `application_status` to `pending` and `is_verified_wholesale` remains `false`.
   - After submission, users see a "Request Received" confirmation screen telling them they'll be contacted via WhatsApp within 24–48 hours for verification.

4. Admin verification
   - Admin/staff review pending applications via admin interfaces (`/admin/staff` or a dedicated admin tool). Admin updates `profiles.application_status` to `approved` or `rejected` and sets `is_verified_wholesale = true` for approvals.
   - Once approved & verified, the user can access `/wholesale` and see the full Bulk Order Sheet.

5. Access gating
   - `src/app/wholesale/page-wrapper.tsx` checks `getUserProfile(user.id)` and `canAccessWholesale(profile)` (requires `is_verified_wholesale && application_status === 'approved'`). If false, render `WholesalerLocked`.

Failure modes and mitigations:
- Missing profile row: `getUserProfile()` returns null; UI prompts to sign in or apply.
- Race during signup: profile insertion may fail — system logs insertion errors and continues. Consider making this a transactional operation or using Supabase functions to guarantee consistency.

---

## Ordering & Fulfillment Logic (The "WhatsApp Hybrid")

Implemented in `src/app/wholesale/page.tsx`, `src/lib/whatsapp.ts`, and order UI components.

Business rules implemented:
- MOV (Minimum Order Value / Minimum Units): 5 bulk units required to checkout. The UI disables the confirm button and shows `MINIMUM 5 UNITS REQUIRED` with red indicators.
- Two split flows by account type:
  - Schools (`wholesale_school`): Place order -> format WhatsApp message with header "School Credit Order - LPO to be provided on delivery" -> open WhatsApp deep link immediately. Payment reconciliation occurs offline via LPO on delivery.
  - Resellers (`wholesale_general`): Place order -> trigger M-Pesa STK push (placeholder implementation) -> on successful payment, format WhatsApp message "Reseller Order - Payment Confirmed via M-Pesa" and open WhatsApp.

Detailed steps:
1. Cart & MOV
   - Cart is a collection of `CartItem { productId, quantity }`. The Floating Summary computes `totalQuantity`, `totalAmount`, and `totalWeight`.
   - If `totalQuantity < MOV_REQUIRED` (5) the confirm button is disabled; the UI shows the required MOV.

2. Submit (Schools)
   - Build `OrderItem` lines (name, size, quantity, unitPrice, subtotal), compute total.
   - Use `formatWhatsAppMessage()` which composes a message including institution name, user name and role, order details list, total, and delivery note.
   - Open `https://wa.me/{phone}?text={encodedMessage}` in a new tab/window.
   - Optionally persist an order record in Supabase when backend is wired; currently the code logs and opens WhatsApp.

3. Submit (Resellers)
   - Intended flow: call M-Pesa STK Push API (server-side) and wait for success callback.
   - On success, format and open WhatsApp with "Payment Confirmed via M-Pesa" message.
   - Implementation note: M-Pesa integration is not completed — the UI uses a placeholder. For production, implement an authenticated server endpoint that performs STK Push with safekeeping of keys and validates callback events.

Edge cases & mitigation:
- WhatsApp open fails (blocked popups): the UI should persist order draft server-side and notify the user to retry; current code uses `window.open` and alerts — plan to store order and present a retry link.
- Payment failure: STK failure should surface a clear error and allow retry.
- Cart changes while waiting: disable inputs during pending payment.

---

## WhatsApp Message Formatting

Implemented: `src/lib/whatsapp.ts` contains `formatWhatsAppMessage(orderDetails)` and `openWhatsAppWithMessage()`.

Message structure:
- Title: *CANVUS WHOLESALE ORDER*
- Order Type header (School Credit vs Reseller Paid)
- Institution: *Institution Name*
- Representative: *Name (Role)*
- Order Date: timestamp (Africa/Nairobi)
- ORDER DETAILS: list of numbered items with name, size, and quantity in Bales
- TOTAL AMOUNT: bolded
- Footer: Delivery Location & Contact

Implementation notes:
- The message is URL-encoded before appending to `wa.me` link.
- For production, replace the hard-coded phone number with a config-driven value in environment variables.

---

## Database Schema & Migration Notes

Migration file: `supabase/migrations/20260422_wholesale_application_flow.sql`

Changes applied:
- `profiles` table additions:
  - `is_verified_wholesale BOOLEAN DEFAULT FALSE`
  - `institution_name TEXT`
  - `rep_role TEXT`
  - `application_status TEXT DEFAULT 'none' CHECK (application_status IN ('none','pending','approved','rejected'))`
- `account_type` constraint updated to allow: `retail`, `wholesale_general`, `wholesale_school`.
- Backfill/mapping: existing `school_name`/`business_name` migrated into `institution_name` where appropriate.
- Indexes added: `idx_profiles_wholesale_verified` and `idx_profiles_institution_name`.

Operational considerations:
- Keep RLS policies updated to ensure only admin roles can update `is_verified_wholesale` and `application_status`.
- Consider writing triggers to notify staff (via email/Slack) on new `application_status = 'pending'` rows.
- Keep admin tools to approve/reject in a transaction that logs audit trail (who approved, when, and reason).

---

## Routes and Component Map (exhaustive view)

Public/UI routes:
- `/` — landing/home
- `/auth/login` — login (`src/app/auth/login/page.tsx`)
- `/auth/signup` — signup (`src/app/auth/signup/page.tsx`)
- `/account` — user account (`src/app/account/page.tsx`)
- `/cart` — cart page (`src/app/cart/page.tsx`)
- `/checkout` — retail checkout (`src/app/checkout/page.tsx`)
- `/wholesale` — wholesale portal (wrapper resolves access; `src/app/wholesale/page-wrapper.tsx`)
- `/wholesale/status` — application status (`src/app/wholesale/status/page.tsx`)

Staff/Admin routes (middleware-guarded):
- `/admin` — admin dashboard
- `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/reports`, `/admin/settings`, `/admin/staff`, `/admin/pos` — role-limited pages
- `/admin/rider` and `/rider` — rider queue and rider-facing pages

Server middleware:
- `middleware.ts` matches `"/admin/:path*", "/rider/:path*", "/auth/login", "/auth/signup"` and enforces staff routing and redirects.

Component map (important files):
- `src/components/auth/auth-provider.tsx` — auth context and signup/login
- `src/components/cart/*` — cart management
- `src/components/wholesale/*` — apply form, locked screen
- `src/app/wholesale/page.tsx` — wholesale portal UI and ordering
- `src/lib/wholesale-profile.ts` — profile utilities for access checks
- `src/lib/whatsapp.ts` — WhatsApp message formatting

---

## Error Handling, Observability & Retry Logic

Current implementation:
- Console logging for important operations (signup, order submission).
- UI alerts for user-facing errors and basic guard checks (MOV enforcement, missing fields).
- TypeScript checks in dev, but no centralized error boundary handling across the app (Next.js App Router error boundaries can be added).

Recommendations (immediate):
- Add server-side order persistence before opening WhatsApp. Persist a draft order that links to user and cart — status `DRAFT`.
- Implement request tracing and logs (structured JSON) and push to an observability backend (Logflare, Sentry).
- Add retry queue for outbound integrations (M-Pesa STK pushes and webhooks) with idempotency keys.
- Add email/Slack notifications for `application_status = 'pending'`.

---

## Security Controls & Threat Mitigations

Authentication & Session
- Use Supabase server-side service key only on server endpoints, never exposed to browser.
- Ensure `getSupabase()` fallback placeholders are not used in production — verify `NEXT_PUBLIC_SUPABASE_URL` and ANON key are present in env.

RBAC & Data Access
- Enforce RLS policies on `profiles`, `orders`, `staff_profiles`, `inventory` tables.
- Only allow admin roles to update `is_verified_wholesale` and `application_status` through audited endpoints.

Third-party integrations
- Store WhatsApp and M-Pesa numbers/credentials in secrets manager or environment variables with restricted access.
- For M-Pesa, validate both STK result callbacks and asynchronous MPesa push notifications using HMAC/keys where available.

Input validation / Abuse prevention
- Validate and rate-limit signup and wholesale applications per IP to prevent spam.
- Sanitize all inputs to avoid injection into stored fields and messages.

Operational security
- Rotate service keys and enforce least privilege.
- Keep dependency updates (Next.js, Supabase SDK) current and watch for CVEs.

---

## Deployment & Operational Playbook

Environment variables (minimum):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_APP_URL`
- `CANVUS_WHATSAPP_NUMBER` (recommended)
- M-Pesa credentials (server-only)

Deployment steps (high-level):
1. Build and run `next build` and `next start` on Vercel or chosen platform.
2. Run pending migrations (`supabase/migrations/*.sql`) against production DB in a maintenance window.
3. Ensure RLS policies and admin roles are in place before flipping migrations that add columns used in policies.
4. Validate email confirmation delivery and WhatsApp deep-links in staging.

Operational runbook for a new wholesale application:
1. Support receives `application_status = pending` notification.
2. Verify institution and representative details via WhatsApp.
3. In admin UI, set `application_status = 'approved'` and `is_verified_wholesale = true` if approved.
4. Notify applicant via WhatsApp and email.

Emergency procedures:
- If an incorrect `is_verified_wholesale` is set, revoke immediately and rotate any elevated session tokens for affected staff.
- If M-Pesa/STK failed en masse: pause payment triggers, investigate downstream logs and reconcile with queued requests.

---

## Appendix: Quick File References

- Auth & Session
  - `src/components/auth/auth-provider.tsx` — signup/login logic and profile insert
  - `src/lib/supabase.ts` — supabase client creation
- Wholesale
  - `src/components/wholesale/wholesale-application-form.tsx`
  - `src/components/wholesale/wholesaler-locked.tsx`
  - `src/app/wholesale/page.tsx`
  - `src/app/wholesale/page-wrapper.tsx`
  - `src/app/wholesale/status/page.tsx`
  - `src/lib/wholesale-profile.ts`
  - `src/lib/whatsapp.ts`
  - `supabase/migrations/20260422_wholesale_application_flow.sql`
- Admin & RBAC
  - `middleware.ts`
  - `src/lib/access-control.ts`
  - `src/lib/staff-session.ts`
  - `src/app/admin/*`
- Cart & Checkout
  - `src/components/cart/*`
  - `src/app/cart/page.tsx`
  - `src/app/checkout/page.tsx`

---

## Closing Notes & Next Steps (recommended roadmap)

1. Complete server-side persistence of wholesale orders before opening WhatsApp, including idempotency and drafts.
2. Implement the M-Pesa STK server integration with secure callback validation.
3. Add admin approval audit logging and notification workflows for `pending` applications.
4. Harden RLS and ensure all administrative actions go through server-side endpoints with proper authentication and logging.
5. Add observability (Sentry, logs) and monitoring for key flows (signup rate, application rate, STK success rate, WhatsApp opens).

If you want, I can now:
- wire the server endpoint to persist wholesale order drafts before opening WhatsApp,
- implement M-Pesa STK push scaffolding (server action + webhook handler), and
- add a small admin page to list pending wholesale applications and approve/reject them.

Would you like me to proceed with any of the above next steps?
