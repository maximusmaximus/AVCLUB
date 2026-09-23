# @avclub/api

Backend services.

## Modules
- `auth/` — Google OAuth, email auth, 18+ age gate
- `roles/` — participants, members, admin, sponsors, Docents, Steward, co-sponsorship, general supporter; multiple roles per account allowed
- `payments/` — credit card, Apple Pay, Google Pay; same-method rule for deposit+donation; automatic refund retry; x402 crypto wallet
- `refunds/` — automatic refund by payment method; donation non-refundable edge case
- `devices/` — pair by scan code or PIN; no device limit; PIN lockout after repeated failures; Google re-sign-in to unlock
- `memberships/` — co-sponsorship $200/mo, supporter $50/mo; cancel = refund + immediate access cut; upgrade path preserves participation history
- `emails/` — auto-email create + send tracking; supporter digest opt-in pop-up
- `github/` — sync bug/feature form submissions to private repo; captcha-gated
- `mcp/` — MCP gateway; access for all user types (scope TBD)
- `events/` — Google Calendar integration, phase cycle, multi-admin control
