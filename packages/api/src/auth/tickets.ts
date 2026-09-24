import crypto from "crypto";
import { CheckinTicket } from "@avclub/types";
import { TIMING } from "@avclub/config";

export class TicketAuthority {
  private secretKey: string;

  constructor(secretKey = "avclub-dev-secret-key-change-in-production") {
    this.secretKey = secretKey;
  }

  /**
   * Generate an expiring, cryptographically signed rolling ticket string.
   */
  public generateTicket(
    userId: string,
    eventId: string,
    userName: string,
    ticketType: "FULL_EVENT" | "PARTY_ONLY" = "FULL_EVENT",
    depositPaid = true,
    ttlSeconds = TIMING.TICKET_EXPIRATION_SECONDS
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + ttlSeconds;

    const payload = `${userId}:${eventId}:${userName}:${ticketType}:${depositPaid ? 1 : 0}:${now}:${expiresAt}`;
    const hmac = crypto
      .createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex");

    const ticket: CheckinTicket = {
      userId,
      eventId,
      userName,
      ticketType,
      depositPaid,
      issuedAtEpochSec: now,
      expiresAtEpochSec: expiresAt,
      hmacSignature: hmac,
    };

    return Buffer.from(JSON.stringify(ticket)).toString("base64url");
  }

  /**
   * Validate an incoming ticket string from a QR scan.
   * Allows a 30-second leeway window for clock skew.
   */
  public verifyTicket(ticketBase64Url: string, leewaySeconds = 30): {
    valid: boolean;
    ticket?: CheckinTicket;
    reason?: string;
  } {
    try {
      const decoded = Buffer.from(ticketBase64Url, "base64url").toString("utf8");
      const ticket: CheckinTicket = JSON.parse(decoded);

      const payload = `${ticket.userId}:${ticket.eventId}:${ticket.userName}:${ticket.ticketType}:${
        ticket.depositPaid ? 1 : 0
      }:${ticket.issuedAtEpochSec}:${ticket.expiresAtEpochSec}`;

      const expectedHmac = crypto
        .createHmac("sha256", this.secretKey)
        .update(payload)
        .digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(ticket.hmacSignature), Buffer.from(expectedHmac))) {
        return { valid: false, reason: "INVALID_SIGNATURE" };
      }

      const now = Math.floor(Date.now() / 1000);
      if (now > ticket.expiresAtEpochSec + leewaySeconds) {
        return { valid: false, ticket, reason: "EXPIRED_CODE" };
      }

      return { valid: true, ticket };
    } catch {
      return { valid: false, reason: "MALFORMED_TICKET" };
    }
  }
}
