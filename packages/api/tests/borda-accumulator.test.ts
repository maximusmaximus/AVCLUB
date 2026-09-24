import { describe, it, expect } from "vitest";
import { BordaVoteAccumulator } from "../src/voting/borda-accumulator.js";
import { Presentation } from "@avclub/types";

describe("BordaVoteAccumulator Live Voting", () => {
  const p1: Presentation = {
    id: "pres-1",
    eventId: "ev-1",
    title: "Modular Synth Light Grid",
    teamName: "Frequency Hackers",
    submitterUserId: "u1",
    submitterName: "Alice",
    taggedMemberIds: [],
    taggedMemberNames: [],
    createdAt: new Date().toISOString(),
  };

  const p2: Presentation = {
    id: "pres-2",
    eventId: "ev-1",
    title: "CRT Video Feedback Loop",
    teamName: "Phosphor Crew",
    submitterUserId: "u2",
    submitterName: "Bob",
    taggedMemberIds: [],
    taggedMemberNames: [],
    createdAt: new Date().toISOString(),
  };

  const p3: Presentation = {
    id: "pres-3",
    eventId: "ev-1",
    title: "Sub-Bass Laser Harp",
    teamName: "Photonics Club",
    submitterUserId: "u3",
    submitterName: "Charlie",
    taggedMemberIds: [],
    taggedMemberNames: [],
    createdAt: new Date().toISOString(),
  };

  it("accurately calculates Borda scores and rankings across ballots", () => {
    const accumulator = new BordaVoteAccumulator([p1, p2, p3]);

    // Voter 1: p1 > p2 > p3 (scores: 3, 2, 1)
    accumulator.castBallot("voter-1", ["pres-1", "pres-2", "pres-3"]);
    // Voter 2: p1 > p3 > p2 (scores: 3, 1, 2)
    accumulator.castBallot("voter-2", ["pres-1", "pres-3", "pres-2"]);
    // Voter 3: p2 > p1 > p3 (scores: 2, 3, 1)
    accumulator.castBallot("voter-3", ["pres-2", "pres-1", "pres-3"]);

    const leaderboard = accumulator.computeLeaderboard();

    // p1: 3 + 3 + 2 = 8 pts (1st)
    // p2: 2 + 1 + 3 = 6 pts (2nd)
    // p3: 1 + 2 + 1 = 4 pts (3rd)
    expect(leaderboard[0].presentationId).toBe("pres-1");
    expect(leaderboard[0].score).toBe(8);
    expect(leaderboard[0].rank).toBe(1);

    expect(leaderboard[1].presentationId).toBe("pres-2");
    expect(leaderboard[1].score).toBe(6);
    expect(leaderboard[1].rank).toBe(2);

    expect(leaderboard[2].presentationId).toBe("pres-3");
    expect(leaderboard[2].score).toBe(4);
    expect(leaderboard[2].rank).toBe(3);
  });

  it("correctly generates 3D podium reveal payload", () => {
    const accumulator = new BordaVoteAccumulator([p1, p2, p3]);
    accumulator.castBallot("voter-1", ["pres-3", "pres-1", "pres-2"]);

    const podium = accumulator.getPodiumReveal();
    expect(podium.firstPlace.presentationId).toBe("pres-3");
    expect(podium.secondPlace.presentationId).toBe("pres-1");
    expect(podium.thirdPlace.presentationId).toBe("pres-2");
    expect(podium.totalBallotsCast).toBe(1);
  });
});
