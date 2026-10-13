import { useEffect, useRef } from "react";
import { foldIfEnded } from "@/lib/access";
import { loadLivePhase, syncNightMail } from "@/lib/mail";
import { sectionForPhase } from "@/lib/night/sections";
import { phaseById, type PhaseId } from "@/lib/night/model";
import { useNight, youPerson } from "@/lib/night/store";

const START = new Date("2026-10-16T16:00:00-07:00").getTime();
const REMIND = START - 15 * 60 * 1000;

export function NightAlerts() {
  const you = useNight(youPerson);
  const primed = useRef(false);

  useEffect(() => {
    void foldIfEnded().catch(() => undefined);
  }, []);

  useEffect(() => {
    const run = () => {
      void syncNightMail().catch(() => undefined);
    };
    run();
    const id = window.setInterval(run, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const notify = (phase: PhaseId) => {
      if (sessionStorage.getItem("avclub-phase-seen") === phase) return;
      sessionStorage.setItem("avclub-phase-seen", phase);
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const section = sectionForPhase(phase);
      const current = phaseById(phase);
      const note = new Notification(`AVCLUB · ${current.title}`, {
        body: section?.action ?? current.blurb,
      });
      if (section) {
        note.onclick = () => {
          window.focus();
          window.location.href = `/e/${section.slug}`;
        };
      }
    };
    const tick = async () => {
      const live = await loadLivePhase().catch(() => null);
      if (!live?.phase) return;
      if (!primed.current) {
        primed.current = true;
        sessionStorage.setItem("avclub-phase-seen", live.phase);
        return;
      }
      notify(live.phase);
    };
    void tick();
    const id = window.setInterval(() => void tick(), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!you) return;
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = Date.now();
      if (now < REMIND || now >= START) return;
      if (sessionStorage.getItem("avclub-reminded") === you.code) return;
      sessionStorage.setItem("avclub-reminded", you.code);
      const note = new Notification("AVCLUB PILOT in 15 minutes", {
        body: `${you.name}, your code is ${you.code}.`,
      });
      note.onclick = () => {
        window.focus();
        window.location.href = "/ticket";
      };
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [you]);

  return null;
}

export async function enableAlerts(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}
