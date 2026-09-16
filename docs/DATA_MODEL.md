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
2. Create Neon project; set `DATABASE_URL` + `DIRECT_URL`
3. Create Clerk app; set publishable + secret keys; webhook `session.created` → `/api/webhooks/clerk` with signing secret
4. `npm run db:migrate` then `npm run db:seed`
5. Set Clerk `publicMetadata.role` to `NIVRA_ADMIN` / `COMPANY_ADMIN` / `COMPANY_EMPLOYEE` (or assign in Neon after first login)
6. Link company users to an `organizationId` in Neon

Without `DATABASE_URL`, admin pages fall back to dummy data and calculators stay usable for local Clerk testing.
