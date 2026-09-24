import { describe, it, expect } from "vitest";
import { TicketAuthority } from "../src/auth/tickets.js";

describe("TicketAuthority Rolling HMAC Verification", () => {
  const authority = new TicketAuthority("test-secret-salt-123");

  it("generates and verifies valid HMAC ticket within TTL", () => {
    const ticketStr = authority.generateTicket(
      "user-001",
      "event-001",
      "Dev Voter",
      "FULL_EVENT",
      true,
      180
    );

    const result = authority.verifyTicket(ticketStr);
    expect(result.valid).toBe(true);
    expect(result.ticket?.userId).toBe("user-001");
    expect(result.ticket?.userName).toBe("Dev Voter");
    expect(result.ticket?.depositPaid).toBe(true);
  });

  it("rejects tampered ticket payload or signature", () => {
    const ticketStr = authority.generateTicket("user-002", "event-001", "Tamper Test");
    const decoded = JSON.parse(Buffer.from(ticketStr, "base64url").toString("utf8"));
    decoded.userId = "user-malicious"; // Change user
    const tamperedStr = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const result = authority.verifyTicket(tamperedStr);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("INVALID_SIGNATURE");
  });

  it("rejects expired tickets beyond leeway window", () => {
    // Generate ticket with negative TTL (already expired)
    const ticketStr = authority.generateTicket(
      "user-003",
      "event-001",
      "Expired User",
      "FULL_EVENT",
      true,
      -100
    );

    const result = authority.verifyTicket(ticketStr, 10);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("EXPIRED_CODE");
  });
});
