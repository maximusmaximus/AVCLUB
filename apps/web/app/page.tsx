"use client";

import React, { useState } from "react";
import {
  EventPhase,
  PHASE_CATALOG,
  Presentation,
  MembershipTier,
} from "@avclub/types";
import { PRICING, TIMING, URLS, THEME, TYPOGRAPHY } from "@avclub/config";
import { EventBanner, PhaseChronometer, VuMeterLoader } from "@avclub/ui";

const MOCK_PRESENTATIONS: Presentation[] = [
  {
    id: "pres-1",
    eventId: "ev-2026-09",
    title: "Modular Laser Synthesizer",
    teamName: "Frequency Lab",
    submitterUserId: "u1",
    submitterName: "Alice Miller",
    taggedMemberIds: [],
    taggedMemberNames: ["Dave", "Elena"],
    demoUrl: "https://laser-synth.demo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pres-2",
    eventId: "ev-2026-09",
    title: "Phosphor CRT Oscilloscope Art",
    teamName: "Cathode Ray Club",
    submitterUserId: "u2",
    submitterName: "Bob Vance",
    taggedMemberIds: [],
    taggedMemberNames: ["Marcus"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "pres-3",
    eventId: "ev-2026-09",
    title: "Audio-Reactive Ferrofluid Tube",
    teamName: "Magnetic Waves",
    submitterUserId: "u3",
    submitterName: "Charlie Cox",
    taggedMemberIds: [],
    taggedMemberNames: ["Zoe"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "pres-4",
    eventId: "ev-2026-09",
    title: "Brutalist LED Matrix Sequencer",
    teamName: "Silicon Grid",
    submitterUserId: "u4",
    submitterName: "Diana Prince",
    taggedMemberIds: [],
    taggedMemberNames: ["Ken"],
    createdAt: new Date().toISOString(),
  },
];

export default function WebAppPage() {
  const [activeTab, setActiveTab] = useState<
    "portal" | "signup" | "phone_vote" | "sponsor_preview" | "feedback"
  >("portal");

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [donationAmount, setDonationAmount] = useState(0);
  const [ticketType, setTicketType] = useState<"FULL_EVENT" | "PARTY_ONLY">("FULL_EVENT");
  const [payAtDoor, setPayAtDoor] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [membership, setMembership] = useState<MembershipTier>("NONE");
  const [digestOptIn, setDigestOptIn] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  // Phone voting state
  const [rankedList, setRankedList] = useState<Presentation[]>(MOCK_PRESENTATIONS);
  const [ballotLocked, setBallotLocked] = useState(false);

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<"BUG" | "FEATURE">("FEATURE");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [captchaSolved, setCaptchaSolved] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Sponsor preview state
  const [previewMedia, setPreviewMedia] = useState<"JPEG" | "VIDEO">("JPEG");

  const moveRank = (index: number, direction: "up" | "down") => {
    if (ballotLocked) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankedList.length) return;

    const copy = [...rankedList];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setRankedList(copy);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageVerified) {
      alert("You must be 18 or older to join AVCLUB.");
      return;
    }
    setSignupComplete(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navigation Bar ── */}
      <nav className="border-b border-cyberCyan/20 bg-surface/90 px-6 py-4 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">🎧</span>
            <div>
              <div className="text-xl font-extrabold uppercase tracking-wider text-white">
                AVCLUB
              </div>
              <div className="text-xs font-mono text-cyberCyan">
                BUILD COOL AV IN A ROOM FULL OF PEOPLE. REPEAT.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "portal", label: "🏠 Overview" },
              { id: "signup", label: "🎟️ Join / Ticket" },
              { id: "phone_vote", label: "📲 Live Vote" },
              { id: "sponsor_preview", label: "🎮 Sponsor Preview" },
              { id: "feedback", label: "🐛 Bugs & Features" },
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
        </div>
      </nav>

      {/* ── Main Content Surfaces ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        {/* TAB 1: PORTAL / OVERVIEW */}
        {activeTab === "portal" && (
          <div className="space-y-10">
            <EventBanner
              phase="BUILD"
              customSubtitle="NEXT EVENT: TONIGHT 6:00 PM // 15 HARDWARE ARTISTS // SAN FRANCISCO"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: The Room */}
              <div className="rounded-2xl border border-cyberCyan/30 bg-surface p-6 shadow-[0_0_25px_rgba(0,240,255,0.1)]">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="text-lg font-extrabold uppercase text-white mb-2">
                  The Club is the Room
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Real-world collaborative blocks of time to construct audio, video, lighting, and
                  kinetic systems. Lightning presentations, live crowd voting, sponsor prizes, and
                  after-parties.
                </p>
              </div>

              {/* Card 2: The Rules */}
              <div className="rounded-2xl border border-laserAmber/30 bg-surface p-6 shadow-[0_0_25px_rgba(255,184,0,0.1)]">
                <div className="text-3xl mb-3">⚖️</div>
                <h3 className="text-lg font-extrabold uppercase text-white mb-2">
                  The Rules Up Front
                </h3>
                <ul className="text-sm text-gray-400 space-y-1.5 list-disc list-inside">
                  <li><b>18+</b> required for membership and entry.</li>
                  <li><b>$10 Deposit</b>: 100% refundable automatically after the night.</li>
                  <li><b>Donations</b>: Non-refundable (same payment method).</li>
                  <li><b>Grace Window</b>: ~10 minutes after start. Late arrivals watch only.</li>
                </ul>
              </div>

              {/* Card 3: Google Calendar */}
              <div className="rounded-2xl border border-neonPurple/30 bg-surface p-6 shadow-[0_0_25px_rgba(112,0,255,0.15)]">
                <div className="text-3xl mb-3">📅</div>
                <h3 className="text-lg font-extrabold uppercase text-white mb-2">
                  Event Calendar
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Subscribe to our official recurring Google Calendar stream to stay locked into
                  every upcoming build night.
                </p>
                <a
                  href="#calendar-sync"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Calendar Stream URI copied to clipboard!");
                  }}
                  className="inline-block px-4 py-2 rounded bg-neonPurple/30 border border-neonPurple text-xs font-bold font-mono text-white hover:bg-neonPurple/50 transition-all"
                >
                  🔗 COPY CALENDAR FEED
                </a>
              </div>
            </div>

            {/* The Event Cycle Breakdown */}
            <div className="rounded-2xl border border-surfaceBorder bg-surface/60 p-8">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">
                The Night on the Clock
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(
                  [
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
                  ] as EventPhase[]
                ).map((phase) => {
                  const meta = PHASE_CATALOG[phase];
                  return (
                    <div
                      key={phase}
                      className="border border-surfaceBorder rounded-xl p-3 bg-black/40 text-center"
                    >
                      <div className="text-2xl mb-1">{meta?.emoji}</div>
                      <div className="text-xs font-extrabold uppercase text-white truncate">
                        {meta?.title}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        {meta?.defaultDurationSec
                          ? `${Math.round(meta.defaultDurationSec / 60)}m`
                          : "Door"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIGNUP & TICKETS */}
        {activeTab === "signup" && (
          <div className="max-w-2xl mx-auto rounded-2xl border border-cyberCyan/30 bg-surface p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
            <h2 className="text-3xl font-black uppercase text-white mb-2">
              Join AVCLUB // RSVP & Ticket
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Pick how you show up. Deposit is refunded automatically to your payment method after
              the event.
            </p>

            {signupComplete ? (
              <div className="text-center p-8 border border-signalGreen/40 rounded-xl bg-black/60">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-black text-signalGreen uppercase mb-2">
                  RSVP Confirmed!
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Welcome to AVCLUB, <b>{fullName}</b>. Your ticket has been registered.
                </p>
                <div className="p-4 bg-surface rounded-lg border border-cyberCyan/40 font-mono text-xs text-cyberCyan mb-6">
                  {payAtDoor
                    ? "STATUS: PAY AT DOOR // SETTLE $10 DEPOSIT WITH STEWARD"
                    : "STATUS: $10 REFUNDABLE DEPOSIT VAULTED VIA STRIPE"}
                </div>
                <button
                  onClick={() => setSignupComplete(false)}
                  className="px-4 py-2 text-xs font-bold uppercase rounded bg-surfaceBorder text-gray-300 hover:text-white"
                >
                  Edit Information
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full bg-black border border-surfaceBorder rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyberCyan font-sans text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Email Address (For Notifications & Tickets)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@example.com"
                    className="w-full bg-black border border-surfaceBorder rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyberCyan font-sans text-sm"
                  />
                </div>

                {/* Ticket Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Select Ticket
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketType("FULL_EVENT")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        ticketType === "FULL_EVENT"
                          ? "border-cyberCyan bg-cyberCyan/10 text-white"
                          : "border-surfaceBorder bg-black text-gray-400"
                      }`}
                    >
                      <div className="font-extrabold uppercase text-sm">🔨 Full Event</div>
                      <div className="text-xs text-cyberCyan font-mono mt-1">
                        $10 Refundable Deposit
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Participate in build, presentations, and vote.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTicketType("PARTY_ONLY")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        ticketType === "PARTY_ONLY"
                          ? "border-neonPurple bg-neonPurple/10 text-white"
                          : "border-surfaceBorder bg-black text-gray-400"
                      }`}
                    >
                      <div className="font-extrabold uppercase text-sm">🎈 Party Only</div>
                      <div className="text-xs text-neonPurple font-mono mt-1">
                        $10 Non-Refundable
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Enter at 9:00 PM for the closing party.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Pay at Door Option */}
                <div className="p-4 rounded-xl border border-surfaceBorder bg-black/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white uppercase">
                      Pay at the Door Option
                    </div>
                    <div className="text-xs text-gray-400">
                      Save payment for later and settle with the Steward upon arrival.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={payAtDoor}
                    onChange={(e) => setPayAtDoor(e.target.checked)}
                    className="h-5 w-5 accent-cyberCyan cursor-pointer"
                  />
                </div>

                {/* Optional Donation */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Optional Donation (Non-Refundable)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Help fund hardware components and pizza for the club. Uses the same payment
                    method as the deposit.
                  </p>
                  <div className="flex gap-2">
                    {[0, 10, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonationAmount(amt)}
                        className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase border transition-all ${
                          donationAmount === amt
                            ? "border-laserAmber bg-laserAmber/20 text-laserAmber"
                            : "border-surfaceBorder bg-black text-gray-400"
                        }`}
                      >
                        {amt === 0 ? "No Donation" : `+$${amt}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Gate & Legal Toggles */}
                <div className="space-y-3 pt-2 border-t border-surfaceBorder">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={ageVerified}
                      onChange={(e) => setAgeVerified(e.target.checked)}
                      className="h-5 w-5 accent-cyberCyan"
                    />
                    <span className="text-xs text-gray-300">
                      I am <b>18 years of age or older</b>. (Required)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profilePublic}
                      onChange={(e) => setProfilePublic(e.target.checked)}
                      className="h-5 w-5 accent-cyberCyan"
                    />
                    <span className="text-xs text-gray-300">
                      Make my participation profile public to other club members.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-cyberCyan text-obsidian font-black uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)]"
                >
                  {payAtDoor
                    ? "Reserve Ticket (Pay at Door)"
                    : `Complete RSVP ($${10 + donationAmount}.00)`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: PHONE DRAG-TO-RANK VOTING */}
        {activeTab === "phone_vote" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <div className="inline-block px-3 py-1 rounded-full border border-cyberCyan/40 bg-surface text-cyberCyan text-xs font-mono font-bold tracking-widest uppercase mb-2">
                LIVE MOBILE BALLOT // PHASE: VOTE
              </div>
              <h2 className="text-3xl font-black uppercase text-white tracking-tight">
                Drag to Rank Your Top Works
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Use the arrow controls to drag presentations into your preferred order. Mirrored
                live on the stage screen!
              </p>
            </div>

            <div className="space-y-3">
              {rankedList.map((pres, index) => {
                const rankNumber = index + 1;
                const isFirst = rankNumber === 1;
                const isSecond = rankNumber === 2;
                const isThird = rankNumber === 3;
                const rankColor = isFirst
                  ? THEME.colors.goldPodium
                  : isSecond
                  ? THEME.colors.silverPodium
                  : isThird
                  ? THEME.colors.bronzePodium
                  : THEME.colors.cyberCyan;

                return (
                  <div
                    key={pres.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-surface transition-all"
                    style={{
                      borderColor: `${rankColor}60`,
                      boxShadow: isFirst ? `0 0 20px ${rankColor}25` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-black font-mono text-sm border"
                        style={{
                          backgroundColor: `${rankColor}20`,
                          color: rankColor,
                          borderColor: rankColor,
                        }}
                      >
                        {rankNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase text-white leading-tight">
                          {pres.title}
                        </h4>
                        <div className="text-xs text-gray-400 font-mono">
                          TEAM: {pres.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveRank(index, "up")}
                        disabled={index === 0 || ballotLocked}
                        className="p-2 rounded bg-black/60 border border-surfaceBorder text-gray-300 hover:text-white disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveRank(index, "down")}
                        disabled={index === rankedList.length - 1 || ballotLocked}
                        className="p-2 rounded bg-black/60 border border-surfaceBorder text-gray-300 hover:text-white disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setBallotLocked(true);
                alert("Your ballot has been locked in and broadcast to the stage screen!");
              }}
              disabled={ballotLocked}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-wider transition-all ${
                ballotLocked
                  ? "bg-surfaceBorder text-gray-500 cursor-not-allowed"
                  : "bg-cyberCyan text-obsidian hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              }`}
            >
              {ballotLocked ? "✓ Ballot Locked In" : "Lock in Ballot"}
            </button>
          </div>
        )}

        {/* TAB 4: SPONSOR VIEWPORT PREVIEW */}
        {activeTab === "sponsor_preview" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-black uppercase text-white tracking-tight">
                Sponsor Media Preview Viewport
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Preview how your ad will display on the paired stage screen during Intermission and
                Sponsor Time with pending participant info overlaid.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPreviewMedia("JPEG")}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  previewMedia === "JPEG"
                    ? "border-cyberCyan bg-cyberCyan/20 text-cyberCyan"
                    : "border-surfaceBorder bg-surface text-gray-400"
                }`}
              >
                Full-Res JPEG Ad
              </button>
              <button
                onClick={() => setPreviewMedia("VIDEO")}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  previewMedia === "VIDEO"
                    ? "border-neonPurple bg-neonPurple/20 text-neonPurple"
                    : "border-surfaceBorder bg-surface text-gray-400"
                }`}
              >
                Background MP4 Video Ad
              </button>
            </div>

            {/* Stage Screen Simulation Frame */}
            <div className="relative aspect-video rounded-2xl border-2 border-cyberCyan/40 bg-surface overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col justify-between p-6">
              {/* Simulated Ad Background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-slate-900 to-cyan-950 opacity-60" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="px-3 py-1 rounded bg-black/70 border border-cyberCyan/50 text-xs font-mono text-cyberCyan font-bold">
                  // SPONSOR DISPLAY // OFFICIAL CLUB PARTNER
                </div>
                <div className="text-xs font-mono text-gray-400">STAGE VIEWPORT: 1920x1080</div>
              </div>

              {/* Centered Overlaid Content */}
              <div className="relative z-10 text-center my-auto">
                <h3 className="text-4xl sm:text-5xl font-black uppercase text-white tracking-tight drop-shadow-md">
                  NEON LOGIC SYSTEMS
                </h3>
                <p className="text-cyberCyan font-mono text-sm tracking-widest mt-2 uppercase">
                  OFFICIAL HARDWARE SPONSOR // PROUD SUPPORTER OF AVCLUB BUILDERS
                </p>
              </div>

              {/* Pending Participant Overlay */}
              <div className="relative z-10 bg-black/80 border border-surfaceBorder rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300">
                  CURRENTLY CHECKED IN: <b className="text-white">18 PARTICIPANTS</b>
                </span>
                <span className="text-signalGreen">STATUS: INTERMISSION ACTIVE (07:42)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BUGS & FEATURES FORM */}
        {activeTab === "feedback" && (
          <div className="max-w-xl mx-auto rounded-2xl border border-surfaceBorder bg-surface p-8 shadow-xl">
            <h2 className="text-3xl font-black uppercase text-white mb-2">
              Bugs & Features
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Submissions are captcha-verified and automatically synced to our private GitHub
              repository issue queue.
            </p>

            {feedbackSubmitted ? (
              <div className="p-6 rounded-xl border border-signalGreen/40 bg-black/60 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h4 className="text-lg font-bold text-signalGreen uppercase mb-1">
                  Issue Dispatched
                </h4>
                <p className="text-xs text-gray-300">
                  Thank you! Your feedback has been safely logged in the private repository.
                </p>
                <button
                  onClick={() => setFeedbackSubmitted(false)}
                  className="mt-4 px-3 py-1.5 rounded bg-surfaceBorder text-xs text-gray-300 hover:text-white"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFeedbackSubmitted(true);
                }}
                className="space-y-4"
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType("FEATURE")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                      feedbackType === "FEATURE"
                        ? "border-cyberCyan bg-cyberCyan/20 text-cyberCyan"
                        : "border-surfaceBorder bg-black text-gray-400"
                    }`}
                  >
                    ✨ Feature Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("BUG")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                      feedbackType === "BUG"
                        ? "border-dangerRed bg-dangerRed/20 text-dangerRed"
                        : "border-surfaceBorder bg-black text-gray-400"
                    }`}
                  >
                    🐛 Bug Report
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Describe the issue or proposed enhancement
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Provide details..."
                    className="w-full bg-black border border-surfaceBorder rounded-lg p-3 text-white focus:outline-none focus:border-cyberCyan font-sans text-sm"
                  />
                </div>

                <div className="p-3 bg-black/60 border border-surfaceBorder rounded-lg flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>CLOUDFLARE TURNSTILE CAPTCHA:</span>
                  <span className="text-signalGreen font-bold">✓ VERIFIED</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-cyberCyan text-obsidian font-black uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                >
                  Post to Private GitHub Queue
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-surfaceBorder bg-black/60 px-6 py-4 text-center text-xs font-mono text-gray-500">
        <div>// AVCLUB PLATFORM // POWERED BY OPEN SANS & THE ROOM //</div>
      </footer>
    </div>
  );
}
