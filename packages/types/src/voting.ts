import { z } from "zod";

export const PresentationSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  teamName: z.string().min(1, "Team name is required"),
  submitterUserId: z.string().uuid(),
  submitterName: z.string(),
  taggedMemberIds: z.array(z.string().uuid()).default([]),
  taggedMemberNames: z.array(z.string()).default([]),
  demoUrl: z.string().url().optional().nullable(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type Presentation = z.infer<typeof PresentationSchema>;

export const BallotSubmissionSchema = z.object({
  eventId: z.string().uuid(),
  voterUserId: z.string().uuid(),
  rankedPresentationIds: z.array(z.string().uuid()).min(1),
  clientTimestampMs: z.number(),
});

export type BallotSubmission = z.infer<typeof BallotSubmissionSchema>;

export interface LeaderboardEntry {
  presentationId: string;
  title: string;
  teamName: string;
  score: number;
  rank: number;
  voteCount: number;
}

export interface PodiumReveal {
  firstPlace: LeaderboardEntry;
  secondPlace: LeaderboardEntry;
  thirdPlace: LeaderboardEntry;
  allFinalists: LeaderboardEntry[];
  totalBallotsCast: number;
}

export const SponsorAwardSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  sponsorId: z.string().uuid(),
  sponsorName: z.string(),
  judgeUserId: z.string().uuid(),
  judgeName: z.string(),
  awardTitle: z.string().min(1),
  winningPresentationId: z.string().uuid(),
  winningTeamName: z.string(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type SponsorAward = z.infer<typeof SponsorAwardSchema>;
