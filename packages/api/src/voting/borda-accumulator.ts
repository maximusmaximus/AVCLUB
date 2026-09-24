import { LeaderboardEntry, PodiumReveal, Presentation } from "@avclub/types";

export class BordaVoteAccumulator {
  private ballots: Map<string, string[]> = new Map(); // voterUserId -> rankedPresentationIds[]
  private presentations: Map<string, Presentation> = new Map();

  constructor(initialPresentations: Presentation[] = []) {
    for (const p of initialPresentations) {
      this.presentations.set(p.id, p);
    }
  }

  public registerPresentation(p: Presentation) {
    this.presentations.set(p.id, p);
  }

  /**
   * Cast or update a voter's ballot. Overwrites previous ranking for this voter.
   */
  public castBallot(voterUserId: string, rankedPresentationIds: string[]) {
    this.ballots.set(voterUserId, rankedPresentationIds);
  }

  public getVoterCount(): number {
    return this.ballots.size;
  }

  /**
   * Calculate current real-time leaderboard using Borda count method.
   * If there are N presentations:
   * Rank 1 = N points, Rank 2 = N - 1 points, etc.
   */
  public computeLeaderboard(): LeaderboardEntry[] {
    const candidateIds = Array.from(this.presentations.keys());
    const N = candidateIds.length;
    const scores = new Map<string, { score: number; voteCount: number; firstPlaceVotes: number }>();

    for (const id of candidateIds) {
      scores.set(id, { score: 0, voteCount: 0, firstPlaceVotes: 0 });
    }

    for (const [, ranking] of this.ballots.entries()) {
      ranking.forEach((id, index) => {
        const stats = scores.get(id);
        if (stats) {
          const points = Math.max(1, N - index);
          stats.score += points;
          stats.voteCount += 1;
          if (index === 0) {
            stats.firstPlaceVotes += 1;
          }
        }
      });
    }

    const leaderboard: LeaderboardEntry[] = candidateIds.map((id) => {
      const p = this.presentations.get(id)!;
      const stats = scores.get(id) || { score: 0, voteCount: 0, firstPlaceVotes: 0 };
      return {
        presentationId: id,
        title: p.title,
        teamName: p.teamName,
        score: stats.score,
        rank: 1,
        voteCount: stats.voteCount,
      };
    });

    // Sort descending by score; break ties by vote count
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.voteCount - a.voteCount;
    });

    // Assign rank positions (1-indexed)
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }

  /**
   * Produce the final podium reveal object (1st, 2nd, 3rd)
   */
  public getPodiumReveal(): PodiumReveal {
    const leaderboard = this.computeLeaderboard();
    const fallbackEntry = (rank: number): LeaderboardEntry => ({
      presentationId: `none-${rank}`,
      title: "UNAWARDED",
      teamName: "NO ENTRY",
      score: 0,
      rank,
      voteCount: 0,
    });

    return {
      firstPlace: leaderboard[0] || fallbackEntry(1),
      secondPlace: leaderboard[1] || fallbackEntry(2),
      thirdPlace: leaderboard[2] || fallbackEntry(3),
      allFinalists: leaderboard,
      totalBallotsCast: this.ballots.size,
    };
  }
}
