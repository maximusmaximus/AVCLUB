import { PaymentTransactionRecord, RefundStatus } from "@avclub/types";

export interface RefundExecutionResult {
  transactionId: string;
  refundedAmountCents: number;
  status: RefundStatus;
  retryCount: number;
  error?: string;
}

export class AutomatedRefundEngine {
  private maxRetries: number;

  constructor(maxRetries = 3) {
    this.maxRetries = maxRetries;
  }

  /**
   * Process automatic deposit refund for an event attendee.
   * STRICT RULE: Refunds ONLY the depositAmountCents ($10.00).
   * Any donation amount is strictly non-refundable and kept in the merchant balance.
   */
  public async processDepositRefund(
    transaction: PaymentTransactionRecord,
    executeGatewayRefund: (
      paymentIntentId: string,
      amountCents: number
    ) => Promise<{ success: boolean; error?: string }>
  ): Promise<RefundExecutionResult> {
    if (transaction.depositAmountCents <= 0) {
      return {
        transactionId: transaction.id,
        refundedAmountCents: 0,
        status: "EXEMPT",
        retryCount: transaction.refundRetryCount,
      };
    }

    if (transaction.refundStatus === "PROCESSED") {
      return {
        transactionId: transaction.id,
        refundedAmountCents: transaction.depositAmountCents,
        status: "PROCESSED",
        retryCount: transaction.refundRetryCount,
      };
    }

    // Call payment gateway (e.g. Stripe) for partial refund of deposit only
    try {
      const gatewayRes = await executeGatewayRefund(
        transaction.stripePaymentIntentId || "",
        transaction.depositAmountCents
      );

      if (gatewayRes.success) {
        return {
          transactionId: transaction.id,
          refundedAmountCents: transaction.depositAmountCents,
          status: "PROCESSED",
          retryCount: transaction.refundRetryCount,
        };
      }

      // Gateway returned an error (e.g., closed card)
      const nextRetryCount = transaction.refundRetryCount + 1;
      const status: RefundStatus =
        nextRetryCount >= this.maxRetries ? "MANUAL_REQUIRED" : "FAILED_RETRYING";

      return {
        transactionId: transaction.id,
        refundedAmountCents: 0,
        status,
        retryCount: nextRetryCount,
        error: gatewayRes.error || "Gateway refund failed",
      };
    } catch (err: unknown) {
      const nextRetryCount = transaction.refundRetryCount + 1;
      const status: RefundStatus =
        nextRetryCount >= this.maxRetries ? "MANUAL_REQUIRED" : "FAILED_RETRYING";

      return {
        transactionId: transaction.id,
        refundedAmountCents: 0,
        status,
        retryCount: nextRetryCount,
        error: err instanceof Error ? err.message : "Unknown refund error",
      };
    }
  }
}
