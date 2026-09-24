export const PRICING = {
  EVENT_DEPOSIT_CENTS: 1000,          // $10.00 (Refundable automatic)
  PARTY_ONLY_TICKET_CENTS: 1000,      // $10.00 (Non-refundable ticket)
  SUPPORTER_MONTHLY_CENTS: 5000,      // $50.00 / month
  CO_SPONSOR_MONTHLY_CENTS: 20000,    // $200.00 / month
} as const;

export const TIMING = {
  GRACE_WINDOW_MINUTES: 10,
  TICKET_EXPIRATION_SECONDS: 180,    // Rolling HMAC ticket validity
  LIVE_VOTE_DURATION_SECONDS: 180,   // 3 minutes
  INTERMISSION_DURATION_SECONDS: 600, // 10 minutes
  REVEAL_DURATION_SECONDS: 120,      // 2 minutes
  AWARDS_DELAY_AFTER_REVEAL_SEC: 300,// 5 minutes
  PARTY_TIME_DURATION_SECONDS: 10800,// 3 hours
} as const;

export const SECURITY = {
  MAX_PIN_ATTEMPTS: 5,
  SESSION_TOKEN_TTL_HOURS: 24,
  STAGE_DESKTOP_HEARTBEAT_SEC: 5,
  FEEDBACK_RATE_LIMIT_PER_HOUR: 3,
} as const;

export const URLS = {
  PARTY_TIME_REDIRECT: "https://drawing.grok.me",
  FEEDBACK_REPO: "maximusmaximus/AVCLUB",
} as const;
