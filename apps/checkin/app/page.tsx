"use client";

import React, { useState } from "react";
import { THEME, TYPOGRAPHY } from "@avclub/config";

interface Attendee {
  id: string;
  fullName: string;
  email: string;
  ticketType: "FULL_EVENT" | "PARTY_ONLY";
  depositPaid: boolean;
  checkedIn: boolean;
  checkedInAt?: string;
  isLate?: boolean;
  isBuildLocked?: boolean;
  photoConsent: boolean;
}

const INITIAL_ROSTER: Attendee[] = [
  {
    id: "att-1",
    fullName: "Ada Lovelace",
    email: "ada@analytical.engine",
    ticketType: "FULL_EVENT",
    depositPaid: true,
    checkedIn: false,
    photoConsent: false,
  },
  {
    id: "att-2",
    fullName: "Bob Moog",
    email: "bob@minimoog.sound",
    ticketType: "FULL_EVENT",
    depositPaid: false, // Pay at door
    checkedIn: false,
    photoConsent: false,
  },
  {
    id: "att-3",
    fullName: "Clara Rockmore",
    email: "clara@theremin.virtuoso",
    ticketType: "FULL_EVENT",
    depositPaid: true,
    checkedIn: false,
    photoConsent: false,
  },
  {
    id: "att-4",
    fullName: "Delia Derbyshire",
    email: "delia@radiophonic.workshop",
    ticketType: "PARTY_ONLY",
    depositPaid: true,
    checkedIn: false,
    photoConsent: false,
  },
];

export default function CheckinPage() {
  const [stewardKey, setStewardKey] = useState("STEWARD-STATION-01");
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [roster, setRoster] = useState<Attendee[]>(INITIAL_ROSTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  // Check-in form state for selected attendee
  const [photoConsent, setPhotoConsent] = useState(false);
  const [overrideLate, setOverrideLate] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [simulatedMinutesLate, setSimulatedMinutesLate] = useState(0);

  const isLate = simulatedMinutesLate > 10;
  const isWithinGrace = simulatedMinutesLate > 0 && simulatedMinutesLate <= 10;

  const handleConfirmCheckin = () => {
    if (!selectedAttendee) return;
    if (!photoConsent) {
      alert("Photo and recording consent must be collected upon arrival.");
      return;
    }

    const updated = roster.map((att) => {
      if (att.id === selectedAttendee.id) {
        return {
          ...att,
          checkedIn: true,
          checkedInAt: new Date().toLocaleTimeString(),
          isLate,
          isBuildLocked: isLate && !overrideLate,
          photoConsent: true,
          depositPaid: true, // If paying at door, steward collects now
        };
      }
      return att;
    });

    setRoster(updated);
    setSelectedAttendee(null);
    setPhotoConsent(false);
    setOverrideLate(false);
    setOverrideReason("");
    setScanInput("");

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
  };

  const filteredRoster = roster.filter(
    (att) =>
      att.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInCount = roster.filter((r) => r.checkedIn).length;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-obsidian">
        <div className="max-w-md w-full rounded-2xl border-2 border-cyberCyan/40 bg-surface p-8 text-center shadow-[0_0_40px_rgba(0,240,255,0.15)]">
          <div className="text-4xl mb-3">🚪</div>
          <h1 className="text-2xl font-black uppercase text-white mb-2">
            Steward Door Key
          </h1>
          <p className="text-xs text-gray-400 mb-6">
            Enter the keyed Steward credential issued by the administrator. Keys are revocable per
            station.
          </p>
          <input
            type="text"
            value={stewardKey}
            onChange={(e) => setStewardKey(e.target.value)}
            placeholder="STEWARD-KEY-XXXX"
            className="w-full bg-black border border-surfaceBorder rounded-lg px-4 py-3 text-center text-cyberCyan font-mono tracking-widest uppercase mb-4 focus:outline-none focus:border-cyberCyan"
          />
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full py-3.5 rounded-lg bg-cyberCyan text-obsidian font-black uppercase tracking-wider hover:bg-cyan-300"
          >
            Authenticate Station
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Steward Header ── */}
      <header className="border-b border-cyberCyan/20 bg-surface px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚪</span>
          <div>
            <h1 className="text-lg font-black uppercase text-white tracking-wide">
              Steward Door Station
            </h1>
            <div className="text-xs font-mono text-cyberCyan">
              KEY: {stewardKey} // STATION ONLINE
            </div>
          </div>
        </div>

        {/* Live Door Telemetry */}
        <div className="flex items-center gap-4 bg-black/60 border border-surfaceBorder rounded-xl px-4 py-2 text-xs font-mono">
          <div>
            CHECKED IN: <b className="text-signalGreen">{checkedInCount}</b> / {roster.length}
          </div>
          <span className="text-gray-600">|</span>
          <div>
            DOOR STATUS: <b className="text-cyberCyan">ACTIVE</b>
          </div>
        </div>
      </header>

      {/* ── Main Station Content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: QR Scan & Attendee Roster */}
        <div className="space-y-6">
          {/* Simulated QR Code Scan Input */}
          <div className="rounded-2xl border border-cyberCyan/30 bg-surface p-6 shadow-[0_0_25px_rgba(0,240,255,0.08)]">
            <h3 className="text-sm font-extrabold uppercase text-white mb-2 flex items-center gap-2">
              <span>📷</span>
              <span>Scan Expiring Event QR</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Camera scanner or USB barcode reader. Verifies rolling HMAC signature.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan or paste ticket token..."
                className="flex-1 bg-black border border-surfaceBorder rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyberCyan"
              />
              <button
                onClick={() => {
                  const found = roster.find((r) => !r.checkedIn);
                  if (found) setSelectedAttendee(found);
                }}
                className="px-4 py-2 rounded-lg bg-cyberCyan text-obsidian text-xs font-black uppercase tracking-wider"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Attendee Roster & Manual Search */}
          <div className="rounded-2xl border border-surfaceBorder bg-surface p-6">
            <h3 className="text-sm font-extrabold uppercase text-white mb-2">
              Attendee Roster
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-black border border-surfaceBorder rounded-lg px-3 py-2 text-xs text-white mb-4 focus:outline-none focus:border-cyberCyan font-sans"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredRoster.map((att) => (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttendee(att)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedAttendee?.id === att.id
                      ? "border-cyberCyan bg-cyberCyan/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : att.checkedIn
                      ? "border-surfaceBorder bg-black/40 opacity-60"
                      : "border-surfaceBorder bg-black/80 hover:border-gray-500"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white uppercase">{att.fullName}</div>
                    <div className="text-[11px] font-mono text-gray-400">{att.email}</div>
                  </div>
                  <div className="text-right">
                    {att.checkedIn ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-signalGreen/20 text-signalGreen border border-signalGreen/40">
                        CHECKED IN ({att.checkedInAt})
                      </span>
                    ) : att.depositPaid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyberCyan/20 text-cyberCyan border border-cyberCyan/40">
                        DEPOSIT PAID
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-laserAmber/20 text-laserAmber border border-laserAmber/40">
                        COLLECT $10
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Check-in Action Station */}
        <div>
          {selectedAttendee ? (
            <div className="rounded-2xl border-2 border-cyberCyan/50 bg-surface p-8 shadow-[0_0_35px_rgba(0,240,255,0.15)] space-y-6">
              <div>
                <div className="text-xs font-mono text-cyberCyan uppercase tracking-widest mb-1">
                  // ADMISSION DESK // VERIFICATION
                </div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                  {selectedAttendee.fullName}
                </h2>
                <div className="text-xs font-mono text-gray-400">{selectedAttendee.email}</div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg border border-surfaceBorder bg-black/60">
                  <div className="text-gray-400 text-[10px] uppercase">TICKET TYPE</div>
                  <div className="font-bold text-white mt-1">
                    {selectedAttendee.ticketType === "FULL_EVENT"
                      ? "🔨 FULL BUILD EVENT"
                      : "🎈 PARTY ONLY"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-surfaceBorder bg-black/60">
                  <div className="text-gray-400 text-[10px] uppercase">DEPOSIT STATUS</div>
                  <div
                    className={`font-bold mt-1 ${
                      selectedAttendee.depositPaid ? "text-signalGreen" : "text-laserAmber"
                    }`}
                  >
                    {selectedAttendee.depositPaid ? "✓ PAID ($10)" : "⚠️ COLLECT $10 AT DOOR"}
                  </div>
                </div>
              </div>

              {/* Arrival Time & Late Simulation Slider */}
              <div className="p-4 rounded-xl border border-surfaceBorder bg-black/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-300">SIMULATE ARRIVAL TIME:</span>
                  <span className="text-cyberCyan font-bold">+{simulatedMinutesLate} MIN LATE</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={simulatedMinutesLate}
                  onChange={(e) => setSimulatedMinutesLate(Number(e.target.value))}
                  className="w-full accent-cyberCyan"
                />

                {isLate ? (
                  <div className="p-3 rounded-lg border border-dangerRed bg-dangerRed/10 text-dangerRed text-xs font-bold font-mono">
                    🚨 LATE ARRIVAL (PAST 10M GRACE WINDOW)
                    <div className="text-[11px] font-normal mt-0.5 text-gray-300">
                      Attendee may check in and watch, but build participation is locked and deposit
                      is non-refundable per club rules.
                    </div>
                  </div>
                ) : isWithinGrace ? (
                  <div className="p-2.5 rounded-lg border border-laserAmber bg-laserAmber/10 text-laserAmber text-xs font-mono font-bold">
                    ⏳ ARRIVED WITHIN 10M GRACE WINDOW // BUILD PARTICIPATION PERMITTED
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border border-signalGreen bg-signalGreen/10 text-signalGreen text-xs font-mono font-bold">
                    ✓ ARRIVED ON TIME // FULL ADMISSION
                  </div>
                )}

                {/* Steward Discretionary Override */}
                {isLate && (
                  <div className="pt-2 border-t border-surfaceBorder">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overrideLate}
                        onChange={(e) => setOverrideLate(e.target.checked)}
                        className="h-4 w-4 accent-cyberCyan"
                      />
                      <span>Steward Discretionary Grace Override (e.g. Line Delay)</span>
                    </label>
                    {overrideLate && (
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Reason for override..."
                        className="mt-2 w-full bg-black border border-surfaceBorder rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Mandatory Photo / Recording Consent */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-cyberCyan/40 bg-cyberCyan/5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={photoConsent}
                  onChange={(e) => setPhotoConsent(e.target.checked)}
                  className="h-5 w-5 mt-0.5 accent-cyberCyan"
                />
                <div className="text-xs text-gray-300">
                  <b className="text-white">Photo & Recording Consent (Mandatory)</b>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Attendee agrees to being photographed or recorded during presentations and
                    building sessions for AVCLUB archives.
                  </p>
                </div>
              </label>

              {/* Confirm Admission Button */}
              <button
                onClick={handleConfirmCheckin}
                className="w-full py-4 rounded-xl bg-signalGreen text-obsidian font-black uppercase tracking-wider hover:bg-emerald-400 shadow-[0_0_25px_rgba(0,255,136,0.3)] transition-all"
              >
                Confirm Check-in & Grant Entry
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-surfaceBorder text-center text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">Scan a ticket code or select an attendee from the roster.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
