# Data model

Five domain entities. Physical tables hang under them. The calculator engine stays **stateless**: never store client PII, inputs, result JSON, or PDFs.

## Entities

1. **Platform** — `Plan`, `Calculator` (catalog)
2. **Organization** — tenant + branding + soft-lock (`NONE` → `VIEW_ONLY` 3 days → `HARD_LOCKED`)
3. **User** — Clerk `clerkUserId`; roles `NIVRA_ADMIN` | `COMPANY_ADMIN` | `COMPANY_EMPLOYEE`; 1 org (null for platform admins)
4. **Subscription** — plan link, status, Razorpay ids (stubbed)
5. **Usage** — `UsagePeriod`, `ReportEvent`, `AuditLog`, `LoginEvent`, `WebhookEvent`

## Auth

- **Clerk** for identity and sessions only. Organizations live in Neon, not Clerk Organizations.
- Every login via Clerk.
- **One session per user**: on `session.created` webhook, revoke all other active Clerk sessions (new login wins).
- Sync Neon `User` on authenticated requests via `syncUserFromClerk()`.

## Entitlements

`getEntitlements({ role, organizationId })` — tier unlocks calculators (`minTierLevel`), soft-lock gates browse vs generate, report quota via conditional `UPDATE` (display `reportsRemaining` is never authoritative).

## Setup

1. Copy `.env.example` → `.env`
2. Create a Neon project (or `npx neonctl auth` then `npx neonctl projects create --name nivra-demo`)
3. Set `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) in `.env`
4. Create / link a Clerk app: `npx clerk auth login` then `npx clerk apps create nivra-demo` and `npx clerk init --app <id> --framework next -y`
5. Keep `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login` (branded login page)
6. Set `PLATFORM_ADMIN_EMAIL` to your email (default `yashurade27@gmail.com`)
7. `npx prisma migrate deploy` then `npx prisma db seed`
8. Optional: `node --env-file=.env --import tsx scripts/link-platform-admin.ts <clerkUserId>`
9. In Clerk Dashboard → Webhooks, point `session.created` to `/api/webhooks/clerk` (use ngrok locally) and set `CLERK_WEBHOOK_SIGNING_SECRET`
10. Sign in at `/login` with the platform admin email (email code or password)

Without `DATABASE_URL`, admin pages fall back to dummy data and calculators stay usable for local Clerk testing.
