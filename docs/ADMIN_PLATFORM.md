# Admin platform — confirmed decisions

Source of truth for agents: [`.cursor/rules/admin-platform.mdc`](../.cursor/rules/admin-platform.mdc).

## Dashboards

| Dashboard | Route | Audience |
| --- | --- | --- |
| Nivra admin | `/admin` | Platform main admin + support staff |
| Company admin | `/company` | Tenant Owner / Advisor / Viewer |

Auth is **Clerk**. Organizations and entitlements live in Neon ([`docs/DATA_MODEL.md`](DATA_MODEL.md)). Admin pages read Neon when `DATABASE_URL` is set, otherwise fall back to dummy data. Keep UI on shadcn shell tokens for consistency with `AppShell` / login.

## Confirmed product answers

1. Two admin surfaces: Nivra + Company.
2. Nivra admin: Nivra logo; companies (status, users, logo, tier, report counts); roles = Main admin, Support (advisor).
3. Company admin: seats by plan; Owner = subscriber initially; roles Admin(Owner) / Advisor / Viewer; plan + seats + renewal; calculator access by plan; branding editables; usage read-only; default theme.
4. **Hosting model:** shared app with branding after login (`nivra.app/…`). No custom subdomain/domain at launch.
5. No client logins — advisors generate reports for clients.
6. Launch tiers: pending Sasmith.
7. Soft-lock expired/suspended for **3 days** (view-only), then hard lock.
8. One organisation per user.
9. App chrome uses Nivra logo; PDF reports carry company branding.
10. **"Powered by Nivra"** on every footer and report.
11. Roles: `NIVRA_ADMIN` | `COMPANY_ADMIN` | `COMPANY_EMPLOYEE`.
12. One Clerk session per user (new login wins).
13. Member seat caps deferred for v1.

## Tech stack

| Concern | Choice | Pricing notes |
| --- | --- | --- |
| Hosting | Vercel | Free tier; Pro ~$20/mo + usage |
| Database | Neon + Prisma | Free 0.5 GB; then usage-based |
| Email | Brevo | Free ~300/day; Starter ₹562.50/mo for 5k |
| Images | ImageKit | Free 20 GB bandwidth / 3 GB storage; Paid $9/mo + |
| Auth | **Clerk** | Identity/sessions only; orgs in Neon |
| Logging | Better Stack | Free 3 GB / 3 days; Paid $25 / 40 GB metrics |

## Soft locks / tenancy (implementation notes)

- Soft-lock window: **3 days** view-only after expiry/suspension; then hard lock (block generate/export).
- Do not allow multi-company membership for one user account.
- Company branding applies to reports; chrome stays Nivra-branded with powered-by footer.
