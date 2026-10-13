import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  accessFor,
  durationMs,
  freshPeople,
  INITIAL_BALLOT,
  nextPhaseId,
  phaseById,
  TALKS,
  type Pace,
  type PayMethod,
  type PayWhen,
  type Person,
  type PhaseId,
  type Surface,
  type Talk,
  type TicketKind,
  makeCode,
} from "@/lib/night/model";

export interface Clock {
  phase: PhaseId;
  endsAt: number | null;
  paused: boolean;
  pausedRemaining: number;
  holding: boolean;
  pace: Pace;
}

export interface FeedbackNote {
  id: string;
  kind: "bug" | "feature";
  note: string;
  at: number;
}

interface NightData {
  surface: Surface;
  youId: string | null;
  people: Person[];
  talks: Talk[];
  ballot: string[];
  clock: Clock;
  feedback: FeedbackNote[];
  judgeFirst: string | null;
}

interface NightActions {
  setSurface: (surface: Surface) => void;
  join: (input: {
    name: string;
    ticket: TicketKind;
    payWhen: PayWhen;
    payMethod: PayMethod | null;
    donation: number;
    digest: boolean | null;
    profilePublic: boolean;
    inviteCode?: string | null;
    code?: string;
  }) => void;
  checkIn: (id: string, call: "build" | "watch") => void;
  checkInByCode: (code: string) => string | null;
  startPhase: (phase: PhaseId) => void;
  forward: () => void;
  rewind: () => void;
  pause: () => void;
  resume: () => void;
  extend: () => void;
  setPace: (pace: Pace) => void;
  markHolding: () => void;
  setBallot: (ballot: string[]) => void;
  setJudgeFirst: (title: string) => void;
  addTalk: (title: string, team: string) => void;
  addFeedback: (kind: "bug" | "feature", note: string) => void;
  resetNight: () => void;
}

export type NightState = NightData & NightActions;

function freshClock(): Clock {
  return {
    phase: "CHECKIN",
    endsAt: null,
    paused: false,
    pausedRemaining: 0,
    holding: false,
    pace: "demo",
  };
}

function freshData(): NightData {
  return {
    surface: "join",
    youId: null,
    people: freshPeople(),
    talks: TALKS.map((t) => ({ ...t })),
    ballot: [...INITIAL_BALLOT],
    clock: freshClock(),
    feedback: [],
    judgeFirst: null,
  };
}

function begin(phase: PhaseId, pace: Pace): Pick<Clock, "phase" | "endsAt" | "paused" | "pausedRemaining" | "holding"> {
  const ms = durationMs(phase, pace);
  const now = Date.now();
  return {
    phase,
    endsAt: ms > 0 ? now + ms : null,
    paused: false,
    pausedRemaining: ms,
    holding: false,
  };
}

export const useNight = create<NightState>()(
  persist(
    (set, get) => ({
      ...freshData(),
      setSurface: (surface) => set({ surface }),
      join: (input) => {
        const name = input.name.trim().replace(/\s+/g, " ");
        if (name.length < 2) return;
        const people = get().people.filter((p) => !p.isYou);
        const taken = new Set(people.map((p) => p.code));
        const phase = get().clock.phase;
        const access = accessFor(phase, input.ticket);
        const code = input.code?.trim().toUpperCase() || makeCode(name, taken);
        const surface: Surface = input.ticket === "deposit" ? "phone" : input.ticket === "supporter" || input.ticket === "cosponsor" ? "room" : "profile";
        const you: Person = {
          id: "you",
          name,
          ticket: input.ticket,
          code,
          checkedIn: false,
          consent: false,
          canBuild: access.canBuild,
          watchOnly: access.watchOnly,
          payWhen: input.payWhen,
          payMethod: input.payWhen === "now" ? input.payMethod : null,
          donation: input.donation,
          digest: input.digest,
          profilePublic: input.profilePublic,
          isYou: true,
          paid: true,
          inviteCode: input.inviteCode ?? null,
        };
        set({ youId: you.id, people: [...people, you], surface });
      },
      checkIn: (id, call) => {
        set({
          people: get().people.map((p) => {
            if (p.id !== id || p.checkedIn) return p;
            const canBuild = call === "build" && p.ticket === "deposit";
            return { ...p, checkedIn: true, consent: true, canBuild, watchOnly: !canBuild, doorCall: call };
          }),
        });
      },
      checkInByCode: (code) => {
        const normalized = code.trim().toUpperCase();
        const match = get().people.find((p) => p.code === normalized);
        if (!match) return "No one on tonight's list has that code.";
        if (match.checkedIn) return `${match.name} is already in.`;
        return null;
      },
      startPhase: (phase) => {
        const pace = get().clock.pace;
        set({ clock: { ...get().clock, ...begin(phase, pace) } });
      },
      forward: () => {
        const next = nextPhaseId(get().clock.phase);
        if (!next) return;
        get().startPhase(next);
      },
      rewind: () => {
        const { clock } = get();
        const ms = durationMs(clock.phase, clock.pace);
        if (ms <= 0) return;
        const now = Date.now();
        set({
          clock: {
            ...clock,
            endsAt: now + ms,
            paused: false,
            pausedRemaining: ms,
            holding: false,
          },
        });
      },
      pause: () => {
        const { clock } = get();
        if (!clock.endsAt || clock.paused || clock.holding) return;
        const remain = Math.max(0, clock.endsAt - Date.now());
        set({ clock: { ...clock, paused: true, pausedRemaining: remain } });
      },
      resume: () => {
        const { clock } = get();
        if (!clock.paused) return;
        set({
          clock: {
            ...clock,
            paused: false,
            endsAt: Date.now() + clock.pausedRemaining,
          },
        });
      },
      extend: () => {
        const { clock } = get();
        const add = clock.pace === "real" ? 5 * 60 * 1000 : 25_000;
        const base = clock.paused
          ? clock.pausedRemaining
          : clock.endsAt
            ? Math.max(0, clock.endsAt - Date.now())
            : 0;
        const remain = (clock.holding ? 0 : base) + add;
        set({
          clock: {
            ...clock,
            paused: false,
            holding: false,
            pausedRemaining: remain,
            endsAt: Date.now() + remain,
          },
        });
      },
      setPace: (pace) => {
        const { clock } = get();
        if (pace === clock.pace) return;
        if (clock.endsAt && !clock.paused && !clock.holding) {
          const remain = Math.max(0, clock.endsAt - Date.now());
          const from = Math.max(1, durationMs(clock.phase, clock.pace));
          const to = durationMs(clock.phase, pace);
          const nextRemain = to === 0 ? remain : Math.round(remain * (to / from));
          set({
            clock: {
              ...clock,
              pace,
              endsAt: nextRemain > 0 ? Date.now() + nextRemain : null,
              pausedRemaining: nextRemain,
            },
          });
          return;
        }
        set({ clock: { ...clock, pace } });
      },
      markHolding: () => {
        const { clock } = get();
        if (clock.holding || clock.paused || clock.endsAt == null) return;
        if (Date.now() < clock.endsAt) return;
        set({ clock: { ...clock, holding: true, pausedRemaining: 0 } });
      },
      setBallot: (ballot) => set({ ballot }),
      setJudgeFirst: (title) => set({ judgeFirst: title }),
      addTalk: (title, team) => {
        const cleanTitle = title.trim();
        const cleanTeam = team.trim();
        if (cleanTitle.length < 2 || cleanTeam.length < 2) return;
        const id = `talk-${Date.now()}`;
        const talk: Talk = { id, title: cleanTitle, team: cleanTeam, blurb: "Submitted from the room." };
        set({
          talks: [...get().talks, talk],
          ballot: [...get().ballot, id],
        });
      },
      addFeedback: (kind, note) => {
        const clean = note.trim();
        if (clean.length < 4) return;
        set({
          feedback: [
            { id: `f-${Date.now()}`, kind, note: clean, at: Date.now() },
            ...get().feedback,
          ].slice(0, 20),
        });
      },
      resetNight: () => set(freshData()),
    }),
    {
      name: "avclub-night-v1",
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as {
          clock?: { phase?: string };
          youId?: string | null;
          judgeFirst?: string | null;
          ballot?: string[];
          talks?: { id?: string; title?: string }[];
          people?: { id?: string; ticket?: string; watchOnly?: boolean; canBuild?: boolean; checkedIn?: boolean; isYou?: boolean; paid?: boolean }[];
        };
        if ((version ?? 0) < 2) {
          if (state.clock?.phase === "PARTY") state.clock.phase = "CONCLUDED";
          for (const person of state.people ?? []) {
            if (person.ticket === "party") {
              person.ticket = "deposit";
              person.watchOnly = false;
              if (person.checkedIn) person.canBuild = true;
            }
          }
        }
        if ((version ?? 0) < 3) {
          const unpaid = (state.people ?? []).some((person) => person.isYou && person.paid !== true);
          if (unpaid) {
            state.people = (state.people ?? []).filter((person) => !person.isYou);
            state.youId = null;
          }
        }
        if ((version ?? 0) < 4) {
          const fakeTalk = /^(p[1-5])$/;
          const fakePerson = /^m[1-8]$/;
          state.talks = (state.talks ?? []).filter((talk) => talk.id && !fakeTalk.test(talk.id));
          state.people = (state.people ?? []).filter((person) => person.isYou || (person.id && !fakePerson.test(person.id)));
          if (!state.people.some((person) => person.isYou)) state.youId = null;
          const live = new Set((state.talks ?? []).map((talk) => talk.id));
          state.ballot = (state.ballot ?? []).filter((id) => live.has(id));
          const titles = new Set((state.talks ?? []).map((talk) => talk.title));
          if (state.judgeFirst && !titles.has(state.judgeFirst)) state.judgeFirst = null;
        }
        return state;
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        surface: s.surface,
        youId: s.youId,
        people: s.people,
        talks: s.talks,
        ballot: s.ballot,
        clock: s.clock,
        feedback: s.feedback,
        judgeFirst: s.judgeFirst,
      }),
    },
  ),
);

export function youPerson(state: NightState): Person | null {
  if (!state.youId) return null;
  const person = state.people.find((p) => p.id === state.youId);
  if (!person?.paid) return null;
  return person;
}

export function phaseMeta(state: NightState) {
  return phaseById(state.clock.phase);
}
