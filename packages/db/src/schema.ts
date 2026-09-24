import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  uuid,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  ageVerified18Plus: boolean("age_verified_18_plus").default(false).notNull(),
  isProfilePublic: boolean("is_profile_public").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Roles
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'PARTICIPANT', 'STEWARD', 'ADMIN', etc.
  grantedBy: uuid("granted_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Events
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  googleCalendarEventId: text("google_calendar_event_id"),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  graceWindowMinutes: integer("grace_window_minutes").default(10).notNull(),
  currentPhase: text("current_phase").default("CHECKIN").notNull(),
  phaseStartedAtEpochMs: bigint("phase_started_at_epoch_ms", { mode: "number" }),
  phaseEndsAtEpochMs: bigint("phase_ends_at_epoch_ms", { mode: "number" }),
  isPaused: boolean("is_paused").default(false).notNull(),
  pausedRemainingMs: integer("paused_remaining_ms").default(0).notNull(),
  pairedDesktopCode: text("paired_desktop_code").unique(),
  pairedDesktopDeviceId: text("paired_desktop_device_id"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Check-ins
export const checkins = pgTable("checkins", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  stewardUserId: uuid("steward_user_id").references(() => users.id).notNull(),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
  isLate: boolean("is_late").default(false).notNull(),
  isBuildLocked: boolean("is_build_locked").default(false).notNull(),
  photoRecordingConsent: boolean("photo_recording_consent").default(false).notNull(),
});

// 5. Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventId: uuid("event_id").references(() => events.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  paymentMethodType: text("payment_method_type").notNull(),
  depositAmountCents: integer("deposit_amount_cents").default(0).notNull(),
  donationAmountCents: integer("donation_amount_cents").default(0).notNull(),
  ticketAmountCents: integer("ticket_amount_cents").default(0).notNull(),
  totalChargedCents: integer("total_charged_cents").default(0).notNull(),
  isPayAtDoor: boolean("is_pay_at_door").default(false).notNull(),
  refundStatus: text("refund_status").default("PENDING").notNull(),
  refundRetryCount: integer("refund_retry_count").default(0).notNull(),
  refundLastError: text("refund_last_error"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Presentations
export const presentations = pgTable("presentations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  teamName: text("team_name").notNull(),
  submitterUserId: uuid("submitter_user_id").references(() => users.id).notNull(),
  taggedMemberIds: jsonb("tagged_member_ids").default([]).notNull(),
  demoUrl: text("demo_url"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Votes
export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  voterUserId: uuid("voter_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rankedPresentationIds: jsonb("ranked_presentation_ids").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Sponsor Ads
export const sponsorAds = pgTable("sponsor_ads", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  sponsorUserId: uuid("sponsor_user_id").references(() => users.id).notNull(),
  mediaType: text("media_type").notNull(),
  mediaUrl: text("media_url").notNull(),
  status: text("status").default("PENDING_APPROVAL").notNull(),
  rejectionReason: text("rejection_reason"),
  adSpecsJson: jsonb("ad_specs_json").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Paired Devices
export const pairedDevices = pgTable("paired_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deviceLabel: text("device_label").notNull(),
  deviceRole: text("device_role").notNull(),
  pairingPinHash: text("pairing_pin_hash").notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  mcpToken: text("mcp_token").unique(),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. User Interactions Log
export const interactions = pgTable("interactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id),
  actionType: text("action_type").notNull(),
  metadataJson: jsonb("metadata_json").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Feedback Submissions
export const feedbackSubmissions = pgTable("feedback_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  email: text("email").notNull(),
  feedbackType: text("feedback_type").notNull(), // 'BUG', 'FEATURE'
  message: text("message").notNull(),
  githubIssueUrl: text("github_issue_url"),
  captchaVerified: boolean("captcha_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
