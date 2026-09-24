# AVCLUB

AVCLUB is a real-world community that builds and develops AV projects together — audio, video, light, rooms, and the systems that make them work — through membership and regular in-person events.

The website is the tooling: signup, payments, check-in, a paired room screen, live voting, and the admin controls that keep a night on time. The club is the room.

---

## Purpose

Help people make cool AV work in public, with other people, on a repeating cycle.

- **Build** — a shared block of time to make something real.
- **Show** — lightning presentations so the room sees what landed.
- **Judge and award** — the crowd ranks the work; a sponsor-delegated judge hands out the prizes.
- **Party** — the night closes on drawing.grok.me.
- **Stay in the loop** — membership, email, calendar, and a record of what each person took part in.

## Function

AVCLUB is both a club and a platform.

| Layer | What it does |
| --- | --- |
| Club | Recurring events. Membership. Sponsors. Stewards at the door. A room that runs on a cycle. |
| Platform | QR signup, profiles, Google or email login, deposits and donations, check-in, paired desktop, admin mobile, live vote, MCP for every role. |

Events are sized for **dozens**, not thousands. One venue at a time for now.

---

## High-level summary

1. You join from a QR code, make a profile (18+), and connect Google or email.
2. You pick how you show up: full event ($10 refundable deposit), party only ($10), monthly supporter ($50), or co-sponsor ($200).
3. You check in at the door. A Steward scans your code or picks your name.
4. The room screen runs the cycle: check-in, meet, sponsors, lightning show-and-tell, build, review, vote, awards, party.
5. On your phone you see what’s now, what’s next, and the countdown. During the vote you drag presentations into order; the big screen mirrors it live.
6. First, second, and third land on pedestals with confetti. Five minutes later the judge gives the sponsor awards.
7. Party Time forwards the room to drawing.grok.me.

A typical night with about fifteen members and five teams is on the order of **six hours and fifteen minutes**, including a ten-minute grace window and a ten-minute intermission.

---

## User flow

### Before the night

1. Scan a QR code → signup view.
2. Profile. Google or email. That identity is how you get notified.
3. Rules up front: 18+, late policy, deposit vs donation, what a refund covers.
4. Pay now, or **save payment for later** and settle at the door.
5. Optional donation — same method as the deposit. Donations are not refunded.
6. Optional membership: general supporter or co-sponsorship.
7. Subscribe to the event calendar from the events page.

### At the door

1. Check-in is required.
2. Steward uses a keyed link: pick a name or scan an **expiring** event code.
3. Photo and recording consent is collected here.
4. Late after the grace window: you can still check in, you cannot join the build. That is stated before you pay. No refund for late arrival.
5. Grace window (~10 minutes after start): latecomers can still watch or join Show and Tell; they still cannot build.

### In the room

1. The paired desktop shows the cycle. During downtime or “running but not in a live phase,” it shows the sponsor page. During a live phase it shows **what’s now** and a countdown to **what’s coming**.
2. Every participant sees the same phase status on their phone.
3. Mid-event: ten-minute intermission. Sponsor screen with a centered ten-minute countdown.
4. After lightning presentations: three-minute public vote on mobile (drag to rank). Live on the big screen. Pedestals + confetti. Then the judge.
5. Party Time → drawing.grok.me.

### After

- Deposit refunds automatically by the method you paid with. Failed refunds retry automatically.
- Participation is tracked. You keep that history if you upgrade tiers.
- Supporters who opted in get a project digest by email. Create and send of auto-email is tracked in admin.

---

## The event, section by section

| Phase | Time | What happens |
| --- | --- | --- |
| Check-in | Now / door | Steward check-in. Consent. Event codes expire. |
| Meet and Greet | 15 min | The room meets. |
| Sponsor Time | 5 min | Sponsor presence on the cycle. |
| Show and Tell | Lightning | Teams present. Any member can submit a team and tag teammates. |
| Build | 2 hours | Make the work. |
| Intermission | 10 min | Break. Sponsor screen + centered countdown. |
| Review | 5 min | Look at what got made. |
| Vote | 3 min | Drag-to-rank on phones. Live on the paired screen. |
| Reveal | — | 1st / 2nd / 3rd on pedestals. Confetti. |
| Award Time | 5 min | Judge (delegated by the sponsor) gives sponsor-determined awards, five minutes after the reveal. |
| Party Time | 3 hours | Forwards to drawing.grok.me. Party-only tickets enter here. |

**Admin on the floor.** Mobile: start, pause, forward, rewind. Rewind resets the **timer** on the current phase; it does not reopen a finished phase. If a phase runs long, the admin gets a prompt: extend, cut short, or skip. Two admins can run the same event. If the admin phone drops offline, the paired screen keeps its own timer. The desktop is paired per event and auto-reconnects for that event only.

**Late policy.** No build participation and no deposit refund if you miss the start (after the short grace window). Stated early in signup.

---

## The club, beyond one night

- **Membership** carries people between events: supporter digest, co-sponsorship, tracked participation.
- **Sponsors** put a face on the room — one ad per event, JPEG or background video, preview viewport so they see overlays before go-live. Admin approves. A rejected ad can be resubmitted. Payment: card / Apple Pay / Google Pay, or x402 to a wallet shown in admin.
- **Stewards** are any member an admin promotes. Separate login. One Steward can be revoked without touching the others.
- **Docents** are a pairing role — extra devices and extra hands in the room.
- **MCP** is available to every user type. Whatever that role can do in the app, they can do through MCP, including future functions. The same pairing code that binds a device also lets them hook MCP into the service they want to use it on.
- **Bugs and features** go through a captcha form on the home page into a **private** GitHub repo.
- **Profiles** are public or private — the member chooses. Delete account: history is kept but anonymized.

---

## User types and how values align

One account can hold more than one role.

| Type | What they put in | What they get | Values that line up |
| --- | --- | --- | --- |
| **Participant / member** | Time, a $10 refundable deposit (or pay-later), work in the build, a team tag, a vote | A seat in the cycle, phone status, history of what they made | Making in public. Credit that follows you. A room that starts on time. |
| **Party-only** | $10, no deposit, no build | Party Time only | Show up for the close without pretending you built. |
| **General supporter** | $50 / month | Opt-in email digest of projects created | Follow the work without being in every room. |
| **Co-sponsor** | $200 / month | Standing backing of the club | Put money under the recurring night, not just one ad. |
| **Sponsor** | Ad + payment (cards or x402) + a judge | Screen time, preview viewport, named awards | Brand next to the work, not instead of it. |
| **Judge** | Presence, judgment, handing awards | Full participation plus the award moment | The sponsor’s taste, visible in the room. |
| **Steward** | Door, check-in, consent | A keyed station, revocable on its own login | Care at the threshold. |
| **Docent** | Extra paired device, guidance | Pairing into the same cycle | Help people use the room. |
| **Admin** | Calendar, phases, approvals, refunds, pairing the screen | Dashboards, dual control, mobile transport | Keep the night honest and on the clock. |

**Shared rules that keep those values from colliding**

- Deposit and donation use the **same** payment method. Deposit can refund; donation cannot.
- Cancel a membership: refund and cut access immediately.
- Upgrade from supporter to co-sponsor: participation history stays with you.
- Late after grace: watch / Show and Tell only. No build. No refund.
- Crowd vote is public and short. Sponsor awards are separate and come after, so popularity and patronage are both visible.

---

## Money (quick reference)

| Thing | Amount | Notes |
| --- | --- | --- |
| Event deposit | $10 | Refundable, automatic by method. Retry on failure. |
| Donation | Any | Optional. Same method as deposit. Not refunded. |
| Party-only | $10 | Party Time only. |
| General supporter | $50 / month | Digest is opt-in via yes/no pop-up. |
| Co-sponsorship | $200 / month | |
| Payments accepted | Card, Apple Pay, Google Pay | Sponsors may also pay x402 to the admin wallet. |

---

## Repo map

This repository is the platform next to the club.

**Apps**

- `apps/web` — signup, profile, events, calendar subscribe, bug/feature form, sponsor preview
- `apps/admin` — interactions, donations, refunds, email log, Stewards, ad approval, payments, wallet
- `apps/room` — paired desktop: phases, sponsor media, countdown, vote mirror, party redirect
- `apps/checkin` — Steward door: key, name, scan, late lockout, consent
- `apps/mobile` — admin transport: start / pause / forward / rewind, overrun prompt

**Packages**

- `packages/api` — auth, roles, payments, devices, MCP gateway, calendar, GitHub sync
- `packages/db` — users, events, phases, check-ins, donations, votes, ads, devices
- `packages/config` — methods, age gate, deposit, phase timings, party URL
- `packages/ui` / `packages/types` — shared UI and types

**Docs**

- [`docs/PRODUCT-INGEST.md`](docs/PRODUCT-INGEST.md) — locked product decisions
- [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) — still open
