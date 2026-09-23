# @avclub/db

Database schema.

## Tables (planned)
- users — profile, visibility toggle, age verified, roles[]
- events — calendar link, phases, venue
- phases — name, duration, order, overrun handling
- checkins — user, event, timestamp, late flag, photo consent
- donations — user, event, amount, method, refundable flag
- interactions — all tracked user actions
- emails — created, sent, tracked
- sponsor_ads — one per event, approval status, media (JPEG/video), preview config
- devices — paired devices, role, PIN hash, lockout count
- memberships — type, amount, status, cancel/refund timestamp
- submissions — bug/feature reports from home form
