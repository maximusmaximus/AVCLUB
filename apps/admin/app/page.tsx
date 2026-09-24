"use client";

import React, { useState } from "react";
import { EventPhase, PHASE_CATALOG } from "@avclub/types";
import { THEME } from "@avclub/config";

interface StewardRecord {
  id: string;
  name: string;
  key: string;
  active: boolean;
  issuedAt: string;
}

interface SponsorAdSubmission {
  id: string;
  sponsorName: string;
  mediaType: "JPEG" | "MP4_VIDEO";
  mediaTitle: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

interface RefundLog {
  id: string;
  userName: string;
  depositCents: number;
  donationCents: number;
  status: "PROCESSED" | "FAILED_RETRYING" | "MANUAL_REQUIRED";
  retries: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "transport" | "financials" | "stewards" | "ads" | "wallet"
  >("transport");

  // Multi-Admin Transport State
  const [currentPhase, setCurrentPhase] = useState<EventPhase>("BUILD");
  const [version, setVersion] = useState(12);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSec, setRemainingSec] = useState(6420);
  const [showOverrunModal, setShowOverrunModal] = useState(false);

  // Financials State
  const [refunds, setRefunds] = useState<RefundLog[]>([
    {
      id: "ref-1",
      userName: "Ada Lovelace",
      depositCents: 1000,
      donationCents: 2500,
      status: "PROCESSED",
      retries: 0,
    },
    {
      id: "ref-2",
      userName: "Bob Moog",
      depositCents: 1000,
      donationCents: 0,
      status: "FAILED_RETRYING",
      retries: 1,
    },
    {
      id: "ref-3",
      userName: "Clara Rockmore",
      depositCents: 1000,
      donationCents: 5000,
      status: "PROCESSED",
      retries: 0,
    },
  ]);

  // Stewards State
  const [stewards, setStewards] = useState<StewardRecord[]>([
    {
      id: "st-1",
      name: "Marcus Vance",
      key: "STEWARD-KEY-ALPHA-01",
      active: true,
      issuedAt: "Today 5:00 PM",
    },
    {
      id: "st-2",
      name: "Elena Rostova",
      key: "STEWARD-KEY-BETA-02",
      active: true,
      issuedAt: "Today 5:15 PM",
    },
  ]);

  // Sponsor Ad Queue State
  const [ads, setAds] = useState<SponsorAdSubmission[]>([
    {
      id: "ad-1",
      sponsorName: "Neon Logic Systems",
      mediaType: "JPEG",
      mediaTitle: "Cyberpunk Eurorack Promotion",
      status: "APPROVED",
      submittedAt: "Yesterday 4:00 PM",
    },
    {
      id: "ad-2",
      sponsorName: "Sub-Harmonic Audio",
      mediaType: "MP4_VIDEO",
      mediaTitle: "Bass Synthesizer 4K Reel",
      status: "PENDING_APPROVAL",
      submittedAt: "Today 1:30 PM",
    },
  ]);

  // Handlers
  const handleTransportAction = (action: string) => {
    setVersion((v) => v + 1);
    if (action === "PAUSE") setIsPaused(true);
    if (action === "RESUME") setIsPaused(false);
    if (action === "REWIND") {
      const meta = PHASE_CATALOG[currentPhase];
      setRemainingSec(meta?.defaultDurationSec || 0);
    }
    if (action === "EXTEND") setRemainingSec((s) => s + 300);
    if (action === "FORWARD") {
      const phases: EventPhase[] = [
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
      ];
      const idx = phases.indexOf(currentPhase);
      if (idx < phases.length - 1) {
        setCurrentPhase(phases[idx + 1]);
        setRemainingSec(PHASE_CATALOG[phases[idx + 1]]?.defaultDurationSec || 0);
      }
    }
  };

  const handleRevokeSteward = (id: string) => {
    setStewards(
      stewards.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
  };

  const handleAdStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    setAds(ads.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const totalDonations = refunds.reduce((sum, r) => sum + r.donationCents, 0) / 100;
  const totalDeposits = refunds.reduce((sum, r) => sum + r.depositCents, 0) / 100;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Admin Header ── */}
      <header className="border-b border-cyberCyan/20 bg-surface px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛠️</span>
          <div>
            <h1 className="text-lg font-black uppercase text-white tracking-wide">
              Admin Command Desk
            </h1>
            <div className="text-xs font-mono text-cyberCyan">
              DUAL-ADMIN SYNC ACTIVE // OCC VERSION: {version}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "transport", label: "⏱️ Room Transport" },
            { id: "financials", label: "💰 Ledger & Refunds" },
            { id: "stewards", label: "🚪 Stewards" },
            { id: "ads", label: "🎮 Sponsor Ads" },
            { id: "wallet", label: "🪙 x402 Wallet" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === tab.id
                  ? "bg-cyberCyan text-obsidian shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : "bg-surfaceBorder text-gray-300 hover:bg-surfaceBorderActive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        {/* TAB 1: ROOM TRANSPORT */}
        {activeTab === "transport" && (
          <div className="space-y-8">
            <div className="rounded-2xl border-2 border-cyberCyan/40 bg-surface p-8 shadow-[0_0_35px_rgba(0,240,255,0.12)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs font-mono text-cyberCyan uppercase tracking-widest">
                    // AUTHORITATIVE ROOM CLOCK
                  </div>
                  <h2 className="text-3xl font-black uppercase text-white mt-1">
                    {PHASE_CATALOG[currentPhase]?.emoji} {currentPhase}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Controls the paired stage desktop, voter phones, and steward admissions.
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surfaceBorder bg-black/60 text-xs font-mono">
                  <span className="h-2.5 w-2.5 rounded-full bg-signalGreen animate-ping" />
                  <span className="text-gray-300">ADMINS ACTIVE: <b>2 PHONES</b></span>
                </div>
              </div>

              {/* Big Transport Timer */}
              <div className="text-center my-6">
                <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-white select-none">
                  {Math.floor(remainingSec / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(remainingSec % 60).toString().padStart(2, "0")}
                </div>
                <div className="text-xs font-mono text-gray-400 mt-2 uppercase">
                  STATUS: {isPaused ? "⏸ PAUSED" : "▶ RUNNING"} // VERSION: {version}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-surfaceBorder">
                <button
                  onClick={() => handleTransportAction(isPaused ? "RESUME" : "PAUSE")}
                  className="py-3 rounded-xl border border-cyberCyan font-black uppercase text-xs text-cyberCyan hover:bg-cyberCyan hover:text-obsidian transition-all"
                >
                  {isPaused ? "▶ Resume Phase" : "⏸ Pause Clock"}
                </button>

                <button
                  onClick={() => handleTransportAction("REWIND")}
                  className="py-3 rounded-xl border border-laserAmber font-black uppercase text-xs text-laserAmber hover:bg-laserAmber hover:text-obsidian transition-all"
                >
                  ⏮ Rewind Timer
                </button>

                <button
                  onClick={() => handleTransportAction("EXTEND")}
                  className="py-3 rounded-xl border border-signalGreen font-black uppercase text-xs text-signalGreen hover:bg-signalGreen hover:text-obsidian transition-all"
                >
                  ⏱ +5 Min Extend
                </button>

                <button
                  onClick={() => handleTransportAction("FORWARD")}
                  className="py-3 rounded-xl bg-cyberCyan font-black uppercase text-xs text-obsidian hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  ⏭ Forward Next Phase
                </button>
              </div>

              {/* Overrun Simulator */}
              <div className="mt-6 pt-4 border-t border-surfaceBorder flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Simulate timer expiration / overrun trigger:
                </span>
                <button
                  onClick={() => setShowOverrunModal(true)}
                  className="px-3 py-1 rounded bg-dangerRed/20 border border-dangerRed text-dangerRed text-xs font-bold uppercase"
                >
                  Trigger Overrun Prompt
                </button>
              </div>
            </div>

            {/* Overrun Prompt Modal */}
            {showOverrunModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                <div className="max-w-md w-full rounded-2xl border-2 border-dangerRed bg-surface p-6 shadow-[0_0_50px_rgba(255,42,109,0.3)]">
                  <div className="text-dangerRed font-black uppercase tracking-wider text-xs mb-1">
                    ⚠️ PHASE OVERRUN IN PROGRESS
                  </div>
                  <h3 className="text-2xl font-black uppercase text-white mb-2">
                    {currentPhase} has reached 00:00!
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    The scheduled duration for this phase has elapsed. Choose an administrative
                    action:
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleTransportAction("EXTEND");
                        setShowOverrunModal(false);
                      }}
                      className="w-full py-3 rounded-lg bg-surfaceBorder hover:bg-surfaceBorderActive text-white font-bold uppercase text-xs"
                    >
                      Extend Phase (+5 Minutes)
                    </button>
                    <button
                      onClick={() => {
                        handleTransportAction("FORWARD");
                        setShowOverrunModal(false);
                      }}
                      className="w-full py-3 rounded-lg bg-cyberCyan text-obsidian font-black uppercase text-xs"
                    >
                      Cut Short & Advance Now
                    </button>
                    <button
                      onClick={() => setShowOverrunModal(false)}
                      className="w-full py-2 text-xs text-gray-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FINANCIALS & REFUNDS */}
        {activeTab === "financials" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-surfaceBorder bg-surface p-5">
                <div className="text-xs font-mono text-gray-400 uppercase">
                  TOTAL DEPOSITS (REFUNDABLE)
                </div>
                <div className="text-3xl font-black text-cyberCyan mt-1">
                  ${totalDeposits.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Automatic midnight ACH/Card return</div>
              </div>

              <div className="rounded-xl border border-surfaceBorder bg-surface p-5">
                <div className="text-xs font-mono text-gray-400 uppercase">
                  TOTAL DONATIONS (NON-REFUNDABLE)
                </div>
                <div className="text-3xl font-black text-signalGreen mt-1">
                  ${totalDonations.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Retained in merchant balance</div>
              </div>

              <div className="rounded-xl border border-surfaceBorder bg-surface p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-gray-400 uppercase">REFUND RETRY ENGINE</div>
                  <div className="text-sm font-bold text-white mt-1">STATUS: OPERATIONAL</div>
                </div>
                <button
                  onClick={() => alert("Emergency refund scheduler executed!")}
                  className="mt-3 px-3 py-1.5 rounded bg-surfaceBorder text-xs font-bold uppercase hover:bg-surfaceBorderActive text-cyberCyan"
                >
                  ⚡ Trigger Refund Sweep
                </button>
              </div>
            </div>

            {/* Refunds Table */}
            <div className="rounded-2xl border border-surfaceBorder bg-surface p-6">
              <h3 className="text-lg font-black uppercase text-white mb-4">
                Deposit Refund Queue
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-surfaceBorder text-gray-400">
                      <th className="pb-3">ATTENDEE</th>
                      <th className="pb-3">DEPOSIT</th>
                      <th className="pb-3">DONATION</th>
                      <th className="pb-3">STATUS</th>
                      <th className="pb-3">RETRIES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surfaceBorder">
                    {refunds.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 font-bold text-white">{r.userName}</td>
                        <td className="py-3 text-cyberCyan">${(r.depositCents / 100).toFixed(2)}</td>
                        <td className="py-3 text-signalGreen">
                          ${(r.donationCents / 100).toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.status === "PROCESSED"
                                ? "bg-signalGreen/20 text-signalGreen border-signalGreen/40"
                                : r.status === "FAILED_RETRYING"
                                ? "bg-laserAmber/20 text-laserAmber border-laserAmber/40"
                                : "bg-dangerRed/20 text-dangerRed border-dangerRed/40"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{r.retries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEWARD MANAGEMENT */}
        {activeTab === "stewards" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase text-white">
                  Steward Key Management
                </h2>
                <p className="text-xs text-gray-400">
                  Issue and revoke door station keys. Each steward can be revoked individually
                  without touching other stations.
                </p>
              </div>
              <button
                onClick={() => {
                  const newId = `st-${stewards.length + 1}`;
                  setStewards([
                    ...stewards,
                    {
                      id: newId,
                      name: `Steward #${stewards.length + 1}`,
                      key: `STEWARD-KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                      active: true,
                      issuedAt: "Just now",
                    },
                  ]);
                }}
                className="px-4 py-2 rounded-lg bg-cyberCyan text-obsidian text-xs font-black uppercase tracking-wider"
              >
                + Issue New Key
              </button>
            </div>

            <div className="space-y-3">
              {stewards.map((st) => (
                <div
                  key={st.id}
                  className="rounded-xl border border-surfaceBorder bg-surface p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white uppercase">{st.name}</div>
                    <div className="text-xs font-mono text-cyberCyan mt-0.5">
                      KEY: {st.key} // {st.issuedAt}
                    </div>
                  </div>
                  <div>
                    {st.active ? (
                      <button
                        onClick={() => handleRevokeSteward(st.id)}
                        className="px-3 py-1.5 rounded bg-dangerRed/20 border border-dangerRed text-dangerRed text-xs font-bold uppercase hover:bg-dangerRed hover:text-white transition-all"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded bg-black/60 text-gray-500 text-xs font-mono font-bold">
                        REVOKED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SPONSOR ADS */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase text-white">
                Sponsor Ad Approval Queue
              </h2>
              <p className="text-xs text-gray-400">
                Review sponsor creative before it goes live on the paired stage display.
              </p>
            </div>

            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-xl border border-surfaceBorder bg-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surfaceBorder text-gray-300 uppercase">
                      {ad.mediaType}
                    </span>
                    <h4 className="text-base font-extrabold uppercase text-white mt-1">
                      {ad.sponsorName} — {ad.mediaTitle}
                    </h4>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      SUBMITTED: {ad.submittedAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ad.status === "PENDING_APPROVAL" ? (
                      <>
                        <button
                          onClick={() => handleAdStatus(ad.id, "APPROVED")}
                          className="px-3 py-1.5 rounded bg-signalGreen text-obsidian text-xs font-black uppercase"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdStatus(ad.id, "REJECTED")}
                          className="px-3 py-1.5 rounded bg-dangerRed/20 border border-dangerRed text-dangerRed text-xs font-bold uppercase"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                          ad.status === "APPROVED"
                            ? "bg-signalGreen/20 text-signalGreen border-signalGreen/40"
                            : "bg-dangerRed/20 text-dangerRed border-dangerRed/40"
                        }`}
                      >
                        {ad.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: x402 CRYPTO WALLET */}
        {activeTab === "wallet" && (
          <div className="max-w-xl mx-auto rounded-2xl border border-cyberCyan/30 bg-surface p-8 shadow-xl space-y-6">
            <div>
              <div className="text-xs font-mono text-cyberCyan uppercase tracking-widest mb-1">
                // SPONSOR PAYMENTS // x402 PROTOCOL
              </div>
              <h2 className="text-2xl font-black uppercase text-white">
                Admin Crypto Receiver Wallet
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Sponsors may settle co-sponsorships or event advertisements via x402 direct payment.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-cyberCyan/40 bg-black/60">
              <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">
                PRIMARY PUBLIC RECEPTION ADDRESS (EVM / BASE / SOLANA)
              </div>
              <div className="text-xs sm:text-sm font-mono text-cyberCyan break-all font-bold select-all">
                0x402A779B37E4C0DE98109F1C8B991E0099AVCLUB
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-2">
              <p>• Accepted Currencies: USDC, ETH, SOL, SFX.</p>
              <p>• Transactions are matched to sponsor accounts via metadata invoice IDs.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
