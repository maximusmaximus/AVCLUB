import {
  EventPhase,
  PHASE_CATALOG,
  RoomSyncPacket,
  AdminTransportAction,
} from "@avclub/types";

const PHASE_SEQUENCE: EventPhase[] = [
  "CHECKIN",
  "MEET_GREET",
  "SPONSOR_TIME",
  "SHOW_TELL",
  "BUILD",
  "INTERMISSION",
  "REVIEW",
  "VOTE",
  "REVEAL",
  "AWARDS",
  "PARTY",
  "CONCLUDED",
];

export interface RoomClockState {
  eventId: string;
  currentPhase: EventPhase;
  phaseStartedAtEpochMs: number | null;
  phaseEndsAtEpochMs: number | null;
  isPaused: boolean;
  pausedRemainingMs: number;
  version: number;
  activeVotersCount: number;
  totalCheckedInCount: number;
}

export class RoomClockEngine {
  private state: RoomClockState;

  constructor(eventId: string) {
    this.state = {
      eventId,
      currentPhase: "CHECKIN",
      phaseStartedAtEpochMs: null,
      phaseEndsAtEpochMs: null,
      isPaused: false,
      pausedRemainingMs: 0,
      version: 1,
      activeVotersCount: 0,
      totalCheckedInCount: 0,
    };
  }

  public getState(): RoomClockState {
    return { ...this.state };
  }

  public getSyncPacket(): RoomSyncPacket {
    return {
      eventId: this.state.eventId,
      serverEpochMs: Date.now(),
      currentPhase: this.state.currentPhase,
      phaseStartedAtEpochMs: this.state.phaseStartedAtEpochMs,
      phaseEndsAtEpochMs: this.state.phaseEndsAtEpochMs,
      isPaused: this.state.isPaused,
      pausedRemainingMs: this.state.pausedRemainingMs,
      version: this.state.version,
      activeVotersCount: this.state.activeVotersCount,
      totalCheckedInCount: this.state.totalCheckedInCount,
    };
  }

  public startPhase(phase: EventPhase, expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    const meta = PHASE_CATALOG[phase];
    const now = Date.now();
    const durationMs = (meta?.defaultDurationSec || 0) * 1000;

    this.state.currentPhase = phase;
    this.state.phaseStartedAtEpochMs = now;
    this.state.phaseEndsAtEpochMs = durationMs > 0 ? now + durationMs : null;
    this.state.isPaused = false;
    this.state.pausedRemainingMs = durationMs;
    this.state.version += 1;

    return this.getState();
  }

  public forwardPhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    const currentIndex = PHASE_SEQUENCE.indexOf(this.state.currentPhase);
    if (currentIndex < PHASE_SEQUENCE.length - 1) {
      const nextPhase = PHASE_SEQUENCE[currentIndex + 1];
      return this.startPhase(nextPhase);
    }
    return this.getState();
  }

  public pausePhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    if (this.state.isPaused || !this.state.phaseEndsAtEpochMs) {
      return this.getState();
    }

    const now = Date.now();
    const remaining = Math.max(0, this.state.phaseEndsAtEpochMs - now);

    this.state.isPaused = true;
    this.state.pausedRemainingMs = remaining;
    this.state.version += 1;

    return this.getState();
  }

  public resumePhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    if (!this.state.isPaused) {
      return this.getState();
    }

    const now = Date.now();
    this.state.isPaused = false;
    this.state.phaseEndsAtEpochMs = now + this.state.pausedRemainingMs;
    this.state.version += 1;

    return this.getState();
  }

  /**
   * Rewind: Locked rule: "Rewind resets the timer on the current phase;
   * it does not reopen a finished phase."
   */
  public rewindPhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    const meta = PHASE_CATALOG[this.state.currentPhase];
    const durationMs = (meta?.defaultDurationSec || 0) * 1000;
    const now = Date.now();

    this.state.phaseStartedAtEpochMs = now;
    this.state.phaseEndsAtEpochMs = durationMs > 0 ? now + durationMs : null;
    this.state.isPaused = false;
    this.state.pausedRemainingMs = durationMs;
    this.state.version += 1;

    return this.getState();
  }

  public extendPhase(additionalSeconds: number, expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    const addMs = additionalSeconds * 1000;
    if (this.state.isPaused) {
      this.state.pausedRemainingMs += addMs;
    } else if (this.state.phaseEndsAtEpochMs) {
      this.state.phaseEndsAtEpochMs += addMs;
    }
    this.state.version += 1;
    return this.getState();
  }

  public cutShortPhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    return this.forwardPhase();
  }

  public skipPhase(expectedVersion?: number): RoomClockState {
    this.assertVersion(expectedVersion);
    return this.forwardPhase();
  }

  public handleTransportAction(
    action: AdminTransportAction,
    additionalSeconds = 0,
    expectedVersion?: number
  ): RoomClockState {
    switch (action) {
      case "START":
        return this.startPhase(this.state.currentPhase, expectedVersion);
      case "PAUSE":
        return this.pausePhase(expectedVersion);
      case "RESUME":
        return this.resumePhase(expectedVersion);
      case "FORWARD":
        return this.forwardPhase(expectedVersion);
      case "REWIND":
        return this.rewindPhase(expectedVersion);
      case "EXTEND":
        return this.extendPhase(additionalSeconds || 300, expectedVersion);
      case "CUT_SHORT":
        return this.cutShortPhase(expectedVersion);
      case "SKIP":
        return this.skipPhase(expectedVersion);
      default:
        return this.getState();
    }
  }

  private assertVersion(expectedVersion?: number) {
    if (expectedVersion !== undefined && expectedVersion !== this.state.version) {
      throw new Error(
        `CONCURRENCY_CONFLICT: State has progressed (client version: ${expectedVersion}, server version: ${this.state.version})`
      );
    }
  }
}
