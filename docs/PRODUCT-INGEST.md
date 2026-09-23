# AVCLUB — Product Ingest Brief

Website (front + back) for a real-world community that builds and develops AV projects through membership and regular events.

---

## Actors
- **User** — QR → signup view → profile → Google or email. That identity is the notification channel for next steps. Event code for scan check-in. Must be checked in on arrival. 18+ to sign up. Profile visibility is a user toggle (public or private).
- **Admin** — creates events, schedules them on Google Calendar, tracks exact donations and all platform interactions, can make any user a Steward, pairs a desktop with an access code. Two admins can control the same event simultaneously. Admin mobile has start, pause, forward, rewind between phases.
- **Steward** — any user Admin promotes. Separate login so admin can revoke one Steward's permission without affecting others. Check-in site via a link + key. Select a name or scan event code.
- **Sponsor** — self-serve logo/ad upload, one ad per event, admin must approve before it goes live. Disapproval → advertiser resubmits a new ad with new specs → back through admin review. Pays via the three card methods or x402 to a crypto wallet shown in the admin dashboard; most things can be accepted that way.
- **Docent** — a pairing role (alongside participants, members, admin, sponsors, Stewards).
- **Co-sponsorship member** — $200/month.
- **General supporter** — $50/month; access to all projects created, delivered as an email digest. Digest is opt-in via a yes/no pop-up at signup. Everything a member participates in is tracked and they retain access to that history, including after upgrading from supporter to co-sponsorship.

---

## Flows

### 1. Join
QR → signup view → profile → Google or email → notifications for next steps. Age gate: 18+. Deposit and donation rules (including non-refundable donation on refund) stated early in the process, before payment.

### 2. Events / calendar
Admin creates and puts events on Google Calendar. Events page: subscribe to the Google cal stream + a field for whatever is needed to hook the calendar.

### 3. Money
- Event signup: **$10 refundable deposit**. Refund is automatic, triggered by the payment method used. If a refund fails (e.g., closed card), the system retries automatically.
- Donations optional. Exact donation amounts tracked for admin.
- Deposit and donation must use the **same payment method**. Donations are non-refundable even when the deposit refunds — this edge case is captured.
- Three payment forms: **credit card, Apple Pay, Google Pay**.
- Memberships: co-sponsorship $200/month; general supporter $50/month.
- Cancel membership → refund the money and cut access to that functionality immediately (no grace period).
- Sponsor payments: three card methods or x402 to a crypto wallet provided in the admin dashboard.

### 4. Door / check-in
Check-in required. Steward link + key. Name select or scan event code. Event codes **expire** (to minimize abuse). Users can check in after the event has started, but they are unable to participate in activities. Consent for event photos/recordings is collected at check-in.

### 5. Room screen (paired desktop)
- Admin pairs a desktop with their access code; **re-pair required for each event**.
- Auto-reconnects for the event duration if connection drops.
- Status running or downtime → sponsor logo and sponsor page.
  - Admin supplies either a full-resolution JPEG (optimized per viewport) or a background video with pending participant info overlaid.
  - Sponsors get a preview viewport showing how their ad renders with pending info, from event start onward.
- During the event → back to what's now + countdown to what's coming.
- If admin mobile drops offline mid-event, the paired screen keeps running its own timer.

### 6. Event cycle (first desktop slide)
Checkin (now) → Meet and Greet (15 min) → Sponsor Time (5 min) → Show and Tell (5 min × people who show up) → build time (2 hours) → Review time (5 min) → Award Time (5 min) → Party Time (3 hours).
- Late arrival: no participation, no refund — stated up front at signup.
- If a phase runs long, admin gets a prompt with action buttons (extend, cut short, skip).
- Rewind = reset that phase's timer (phase stays active, clock restarts).
- Party Time → forward to drawing.grok.me.

### 7. Admin dash
All user interactions tracked. Exact donations tracked. Auto-email creation and send both tracked. Failed refunds retried automatically.

### 8. Device pairing
Pair additional devices from an existing account by scanning a code or typing a PIN. Roles: participants, members, admin, sponsors, Docents. No limit on devices per account. Wrong PIN after a set number of attempts → account locked; re-sign-in with Google required.

### 9. Submissions review
User path and admin path to review all submissions.

### 10. Bugs / features
Home-page form with captcha → posts to a **private** GitHub repo.

### 11. MCP
MCP access for all user types (participants, members, admin, sponsors, Docents, Steward, co-sponsorship, general supporter). Scope not yet specified.

### 12. Scale (current)
Dozens per event. Multiple simultaneous events at different venues: not currently, but flagged as a future expansion.

### 13. Data & privacy
- Account deletion → interaction history kept but anonymized.
- Profile visibility: user-chosen (public or private).
- Event photos/recordings: attendee consent required at check-in.

---

## Open / unspecified
- MCP access scope per role.
- Exact templates/cadence for auto-emails (only that create + send are tracked).
- Multi-venue simultaneous events (future).
