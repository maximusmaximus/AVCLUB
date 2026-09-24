import { z } from "zod";

export const CheckinTicketSchema = z.object({
  userId: z.string().uuid(),
  eventId: z.string().uuid(),
  userName: z.string(),
  ticketType: z.enum(["FULL_EVENT", "PARTY_ONLY"]),
  depositPaid: z.boolean(),
  issuedAtEpochSec: z.number(),
  expiresAtEpochSec: z.number(),
  hmacSignature: z.string(),
});

export type CheckinTicket = z.infer<typeof CheckinTicketSchema>;

export const CheckinSubmissionSchema = z.object({
  ticketString: z.string().optional(),
  userId: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  stewardKey: z.string(),
  photoRecordingConsent: z.boolean(),
  stewardOverrideLateGrace: z.boolean().default(false),
  overrideReason: z.string().optional(),
});

export type CheckinSubmission = z.infer<typeof CheckinSubmissionSchema>;

export interface CheckinResult {
  success: boolean;
  userId: string;
  userName: string;
  checkedInAt: string;
  isLate: boolean;
  isBuildLocked: boolean;
  photoConsentGiven: boolean;
  message: string;
}
