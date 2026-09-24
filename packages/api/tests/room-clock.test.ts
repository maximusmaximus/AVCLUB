import { describe, it, expect } from "vitest";
import { RoomClockEngine } from "../src/engine/room-clock.js";

describe("RoomClockEngine State Machine", () => {
  it("advances through phase sequence correctly", () => {
    const engine = new RoomClockEngine("event-test-01");
    expect(engine.getState().currentPhase).toBe("CHECKIN");

    engine.forwardPhase();
    expect(engine.getState().currentPhase).toBe("MEET_GREET");

    engine.forwardPhase();
    expect(engine.getState().currentPhase).toBe("SPONSOR_TIME");

    engine.forwardPhase();
    expect(engine.getState().currentPhase).toBe("SHOW_TELL");

    engine.forwardPhase();
    expect(engine.getState().currentPhase).toBe("BUILD");
  });

  it("enforces Optimistic Concurrency Control (OCC) to prevent multi-admin race conditions", () => {
    const engine = new RoomClockEngine("event-test-02");
    const v1 = engine.getState().version;

    // Admin A advances phase
    engine.forwardPhase(v1);
    expect(engine.getState().version).toBe(v1 + 1);

    // Admin B tries to pause with stale v1
    expect(() => engine.pausePhase(v1)).toThrow("CONCURRENCY_CONFLICT");
  });

  it("rewind resets timer back to initial duration without advancing phase", () => {
    const engine = new RoomClockEngine("event-test-03");
    engine.startPhase("INTERMISSION"); // 10 minutes = 600 seconds
    const stateBefore = engine.getState();
    expect(stateBefore.currentPhase).toBe("INTERMISSION");

    const stateAfter = engine.rewindPhase();
    expect(stateAfter.currentPhase).toBe("INTERMISSION");
    expect(stateAfter.pausedRemainingMs).toBe(600 * 1000);
  });

  it("extends phase duration for overrun handling", () => {
    const engine = new RoomClockEngine("event-test-04");
    engine.startPhase("BUILD");
    const end1 = engine.getState().phaseEndsAtEpochMs!;

    engine.extendPhase(300); // +5 minutes
    const end2 = engine.getState().phaseEndsAtEpochMs!;
    expect(end2 - end1).toBe(300 * 1000);
  });
});
