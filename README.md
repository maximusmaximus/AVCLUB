# AVCLUB

Community engagement platform for building and developing AV projects through membership and regular events.

## Apps

- `apps/web` — public site: signup, profile, events, calendar subscribe, bug/feature form, sponsor preview
- `apps/admin` — admin dashboard: interactions, donations, refunds, email tracking, Steward mgmt, ad approval, payment config
- `apps/room` — paired desktop: event cycle phases, sponsor media, countdown, auto-reconnect
- `apps/checkin` — Steward check-in site: link+key, name select, scan, late-arrival lockout, photo consent
- `apps/mobile` — admin mobile: start/pause/forward/rewind, overrun prompt with action buttons

## Packages

- `packages/api` — backend: auth, roles, payments, refunds, device pairing, MCP gateway, GitHub sync
- `packages/db` — schema: users, events, phases, check-ins, donations, interactions, emails, sponsor ads
- `packages/config` — payment methods, age gate, deposit amount, phase timings
- `packages/ui` — shared UI components
- `packages/types` — shared TypeScript types

## Infra

- `infra/` — deploy, env, secrets

## Docs

- `docs/PRODUCT-INGEST.md` — full product spec (decisions locked in)
- `docs/OPEN-QUESTIONS.md` — unresolved items
