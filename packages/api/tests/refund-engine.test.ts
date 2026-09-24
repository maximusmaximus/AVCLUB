import { describe, it, expect } from "vitest";
import { AutomatedRefundEngine } from "../src/payments/refund-engine.js";
import { PaymentTransactionRecord } from "@avclub/types";

describe("AutomatedRefundEngine", () => {
  const engine = new AutomatedRefundEngine(3);

  it("refunds ONLY the $10 deposit and preserves non-refundable donation", async () => {
    const transaction: PaymentTransactionRecord = {
      id: "tx-1",
      userId: "user-1",
      eventId: "event-1",
      stripePaymentIntentId: "pi_123",
      paymentMethodType: "CARD",
      depositAmountCents: 1000,   // $10.00 deposit (refundable)
      donationAmountCents: 5000,  // $50.00 donation (non-refundable)
      ticketAmountCents: 0,
      totalChargedCents: 6000,
      isPayAtDoor: false,
      refundStatus: "PENDING",
      refundRetryCount: 0,
      createdAt: new Date().toISOString(),
    };

    let attemptedRefundAmount = 0;
    const mockGateway = async (_intentId: string, amountCents: number) => {
      attemptedRefundAmount = amountCents;
      return { success: true };
    };

    const result = await engine.processDepositRefund(transaction, mockGateway);

    expect(result.status).toBe("PROCESSED");
    expect(result.refundedAmountCents).toBe(1000); // Exactly $10.00
    expect(attemptedRefundAmount).toBe(1000); // Verified gateway called for deposit only!
  });

  it("increments retry count on gateway failure and marks MANUAL_REQUIRED when exceeding max retries", async () => {
    const transaction: PaymentTransactionRecord = {
      id: "tx-2",
      userId: "user-2",
      stripePaymentIntentId: "pi_456",
      paymentMethodType: "CARD",
      depositAmountCents: 1000,
      donationAmountCents: 0,
      ticketAmountCents: 0,
      totalChargedCents: 1000,
      isPayAtDoor: false,
      refundStatus: "PENDING",
      refundRetryCount: 2, // Already retried twice
      createdAt: new Date().toISOString(),
    };

    const failGateway = async () => ({ success: false, error: "Card issuer declined refund" });

    const result = await engine.processDepositRefund(transaction, failGateway);

    expect(result.status).toBe("MANUAL_REQUIRED");
    expect(result.retryCount).toBe(3);
    expect(result.error).toContain("Card issuer declined refund");
  });
});
