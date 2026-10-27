"use client";

import React, { useCallback, useState } from "react";
import { PRACTICE, PROVIDERS } from "@/lib/data";
import { VISITS, type Prescription, type Visit, visitDate, when } from "@/lib/portal/mock";
import { VoiceProvider } from "@/lib/voice";
import { Login } from "@/components/portal/Login";
import { Messages } from "@/components/portal/Messages";
import { Prescriptions } from "@/components/portal/Prescriptions";
import { Reschedule } from "@/components/portal/Reschedule";
import { VideoVisit } from "@/components/portal/VideoVisit";
import { VisitDetail } from "@/components/portal/VisitDetail";
import { Visits } from "@/components/portal/Visits";
import { Badge, Button, Card, Icon } from "@/components/ui";

type Tab = "visits" | "messages" | "meds";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visits", label: "Visits", icon: "video" },
  { id: "messages", label: "Messages", icon: "chat" },
  { id: "meds", label: "Medications", icon: "card" },
];

function Portal() {
  const [signedIn, setSignedIn] = useState(false);
  const [now] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("visits");
  const [visits, setVisits] = useState<Visit[]>(VISITS);
  const [open, setOpen] = useState<Visit | null>(null);
  const [moving, setMoving] = useState<Visit | null>(null);
  const [calling, setCalling] = useState<Visit | null>(null);
  const [seed, setSeed] = useState<string | undefined>();

  const provider = "Dr. Okafor";

  /* Leaving the tab unmounts the call, which is also what stops the camera. */
  const go = useCallback((t: Tab) => {
    setTab(t);
    setOpen(null);
    setMoving(null);
    setCalling(null);
    window.scrollTo({ top: 0 });
  }, []);

  const ask = (text: string) => { setSeed(text); go("messages"); };

  if (!signedIn) {
    return <Login onIn={() => setSignedIn(true)} />;
  }

  const next = visits.find((v) => v.status === "upcoming");

  return (
    <div className="flex min-h-screen flex-col min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-paper" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <span className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
              <circle cx="16" cy="16" r="15" fill="#eef3f5" stroke="#b9ced7" />
              <path d="M8 22c3.5 0 4.5-5 8-5s4.5-5 8-5" fill="none" stroke="#2d5468" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="24" cy="12" r="2.4" fill="#5f8871" />
            </svg>
            <span className="font-serif text-[1.0625rem] leading-none text-ink">
              ClearMind <span className="text-slate-500">Medical</span>
            </span>
          </span>
          <button onClick={() => setSignedIn(false)} className="min-h-[2.75rem] px-2 text-sm text-slate-600">
            Sign out
          </button>
        </div>

        {/* Three places, named, always visible. Everything is one tap from here. */}
        <nav aria-label="Portal sections" className="mx-auto max-w-3xl px-2 sm:px-4">
          <ul className="flex">
            {TABS.map((t) => (
              <li key={t.id} className="flex-1">
                <button
                  onClick={() => go(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`flex min-h-[3rem] w-full flex-col items-center justify-center gap-0.5 border-b-2 px-2 pb-1.5 text-xs font-medium transition sm:flex-row sm:gap-2 sm:text-sm ${
                    tab === t.id
                      ? "border-slate-500 text-slate-600"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <Icon name={t.icon} className="h-5 w-5" />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-24">
        {tab === "visits" && calling && (
          <VideoVisit visit={calling} onLeave={() => { setCalling(null); window.scrollTo({ top: 0 }); }} />
        )}

        {tab === "visits" && !calling && moving && (
          <Reschedule
            visit={moving}
            now={now}
            onKeep={() => { setMoving(null); window.scrollTo({ top: 0 }); }}
            onCommit={(hours, providerId) =>
              setVisits((vs) =>
                vs.map((v) =>
                  v.id === moving.id
                    ? {
                        ...v,
                        /* Rebooking a cancelled visit brings it back. */
                        status: "upcoming" as const,
                        hours,
                        providerId,
                        providerName: (() => {
                          const p = PROVIDERS.find((x) => x.id === providerId);
                          return p ? `${p.credential === "MD" || p.credential === "DO" ? "Dr. " : ""}${p.name}` : v.providerName;
                        })(),
                      }
                    : v,
                ),
              )
            }
            onMessage={() => ask(`About my ${moving.kind.toLowerCase()} with ${moving.providerName}: `)}
          />
        )}

        {tab === "visits" && !calling && !moving && !open && (
          <>
            {next && (
              <Card className="mb-6 border-tint-skyInk/15 bg-gradient-to-br from-tint-lilac via-tint-sky/60 to-tint-mint p-5">
                <Badge tone="slate">Next visit</Badge>
                <p className="mt-2.5 font-serif text-[1.35rem] leading-snug text-ink">
                  {when(visitDate(now, next.hours), now)}
                </p>
                <p className="mt-1 text-[0.95rem] text-ink/75">{next.providerName}</p>
              </Card>
            )}
            <Visits
              visits={visits}
              now={now}
              onOpen={(v) => { setOpen(v); window.scrollTo({ top: 0 }); }}
              onCancel={(id) =>
                setVisits((vs) => vs.map((v) => (v.id === id ? { ...v, status: "cancelled" } : v)))
              }
              onMessage={() => ask("")}
              onReschedule={(v) => { setMoving(v); window.scrollTo({ top: 0 }); }}
              onJoin={(v) => { setCalling(v); window.scrollTo({ top: 0 }); }}
            />
          </>
        )}

        {tab === "visits" && !calling && !moving && open && (
          <VisitDetail
            visit={open}
            now={now}
            onBack={() => setOpen(null)}
            onMessage={() => ask(`About my visit on ${when(visitDate(now, open.hours), now)}: `)}
          />
        )}

        {tab === "messages" && <Messages seed={seed} provider={provider} />}

        {tab === "meds" && (
          <Prescriptions
            nextVisit={next ? when(visitDate(now, next.hours), now) : undefined}
            onAsk={(rx: Prescription) =>
              ask(
                rx.status === "needs_visit"
                  ? `I'd like to talk about renewing my ${rx.drug} ${rx.strength}. `
                  : `I'd like a refill on my ${rx.drug} ${rx.strength}. `,
              )
            }
          />
        )}
      </main>

      <a
        href={PRACTICE.phoneHref}
        aria-label={`Need help? Call us at ${PRACTICE.phone}`}
        className="fixed bottom-5 right-4 z-40 inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-full border border-slate-200 bg-panel px-4 text-slate-600 shadow-lift sm:bottom-6 sm:right-6 sm:px-5"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
          <Icon name="phone" className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium"><span className="hidden sm:inline">Need help? </span>Call us</span>
      </a>

      <footer className="border-t border-line bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          <p>
            Not an emergency service. In a crisis, call or text{" "}
            <a href="tel:988" className="font-medium text-slate-600 underline decoration-current underline-offset-2">988</a>.
          </p>
          <p className="mt-2">Prototype — fictional visits, medications and messages.</p>
        </div>
      </footer>
    </div>
  );
}

export default function PortalPage() {
  return (
    <VoiceProvider>
      <Portal />
    </VoiceProvider>
  );
}
