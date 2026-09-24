import { z } from "zod";

export const PaymentMethodTypeSchema = z.enum([
  "CARD",
  "APPLE_PAY",
  "GOOGLE_PAY",
  "X402_CRYPTO",
  "DOOR_CASH",
  "DOOR_TERMINAL",
]);

export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

export const RefundStatusSchema = z.enum([
  "PENDING",
  "PROCESSED",
  "FAILED_RETRYING",
  "MANUAL_REQUIRED",
  "EXEMPT",
]);

export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export const MembershipTierSchema = z.enum([
  "NONE",
  "SUPPORTER",      // $50 / mo
  "CO_SPONSOR",     // $200 / mo
]);

export type MembershipTier = z.infer<typeof MembershipTierSchema>;

export const CheckoutIntentInputSchema = z.object({
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  ticketType: z.enum(["FULL_EVENT", "PARTY_ONLY"]), // FULL_EVENT = $10 deposit; PARTY_ONLY = $10 ticket
  donationAmountCents: z.number().int().nonnegative().default(0),
  isPayAtDoor: z.boolean().default(false),
  membershipTier: MembershipTierSchema.default("NONE"),
  paymentMethodType: PaymentMethodTypeSchema,
});

export type CheckoutIntentInput = z.infer<typeof CheckoutIntentInputSchema>;

export interface PaymentTransactionRecord {
  id: string;
  userId: string;
  eventId?: string;
  stripePaymentIntentId?: string;
  paymentMethodType: PaymentMethodType;
  depositAmountCents: number;
  donationAmountCents: number;
  ticketAmountCents: number;
  totalChargedCents: number;
  isPayAtDoor: boolean;
  refundStatus: RefundStatus;
  refundRetryCount: number;
  refundLastError?: string;
  refundedAt?: string;
  createdAt: string;
}
