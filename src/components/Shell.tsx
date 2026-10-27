"use client";

import React from "react";
import { PRACTICE } from "@/lib/data";
import type { Mode, Step } from "@/lib/types";
import { Icon } from "./ui";

export const FLOW: { key: Step; label: string; short: string }[] = [
  { key: "fit", label: "Fit check", short: "Fit" },
  { key: "care", label: "Your care", short: "Care" },
  { key: "match", label: "Your match", short: "Match" },
  { key: "account", label: "Your account", short: "Details" },
  { key: "payment", label: "Payment", short: "Pay" },
];

function Wordmark({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-2.5 text-left" aria-label="ClearMind Medical home">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#eef3f5" stroke="#b9ced7" />
        <path d="M8 22c3.5 0 4.5-5 8-5s4.5-5 8-5" fill="none" stroke="#2d5468" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="24" cy="12" r="2.4" fill="#5f8871" />
      </svg>
      <span className="font-serif text-[1.0625rem] leading-none text-ink">
        ClearMind <span className="text-slate-500">Medical</span>
      </span>
    </button>
  );
}

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-panel p-0.5" role="group" aria-label="How you'd like to answer">
      {([
        { id: "form" as Mode, label: "Form", icon: "list" },
        { id: "chat" as Mode, label: "Chat", icon: "chat" },
      ]).map((m) => (
        <button
          key={m.id}
          aria-pressed={mode === m.id}
          aria-label={m.id === "form" ? "Answer with a form" : "Answer in a chat"}
          onClick={() => onChange(m.id)}
          className={`inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
            mode === m.id ? "bg-slate-500 text-white" : "text-muted hover:text-ink"
          }`}
        >
          <Icon name={m.icon} className="h-4 w-4" />
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

/** One quiet bar on a phone; named steps once there's room for them. */
function Progress({ step }: { step: Step }) {
  const idx = FLOW.findIndex((f) => f.key === step);
  if (idx < 0) return null;
  const pct = Math.round(((idx + 1) / FLOW.length) * 100);
  return (
    <nav aria-label="Progress" className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-3 sm:hidden">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-sage-500 to-slate-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs text-muted">
            {idx + 1} of {FLOW.length}
          </span>
        </div>
        <ol className="hidden items-center gap-1.5 sm:flex">
          {FLOW.map((f, i) => (
            <li key={f.key} aria-current={i === idx ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={`h-1.5 min-w-0 flex-1 rounded-full transition ${
                  i < idx ? "bg-slate-300" : i === idx ? "bg-slate-500" : "bg-line"
                }`}
              />
              <span className={`shrink-0 text-xs ${i === idx ? "font-medium text-slate-600" : "text-muted"}`}>
                {f.short}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

export function CrisisStrip() {
  return (
    <div className="border-b border-line bg-slate-50/70">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-xs text-slate-600 sm:px-6">
        <Icon name="heart" className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0">
          In crisis?{" "}
          <a href="tel:988" className="font-semibold underline decoration-current underline-offset-2">
            Call or text 988
          </a>
          <span className="text-slate-600"> — free, any hour.</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Always on screen, every step. A phone number is the one thing that still
 * works when the flow doesn't — and for this population, "I'd rather talk to a
 * person" is a legitimate answer at any point, not a failure.
 *
 * It sits above the match screen's sticky hold bar, and `main` reserves room
 * at the bottom so it never covers the chat composer or a Continue button.
 */
function HelpButton({ step }: { step: Step }) {
  const clearsStickyBar = step === "match";
  return (
    <a
      href={PRACTICE.phoneHref}
      aria-label={`Need help? Call us at ${PRACTICE.phone}`}
      className={`fixed right-4 z-40 inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-full border border-slate-200 bg-panel px-4 text-slate-600 shadow-lift transition hover:bg-slate-50 sm:right-6 sm:px-5 ${
        clearsStickyBar ? "bottom-[8.5rem] sm:bottom-6" : "bottom-5 sm:bottom-6"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
        <Icon name="phone" className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium">
        <span className="hidden sm:inline">Need help? </span>Call us
      </span>
    </a>
  );
}

export function Shell({
  step,
  mode,
  onMode,
  onHome,
  onBack,
  onNotes,
  onResources,
  children,
}: {
  step: Step;
  mode: Mode;
  onMode: (m: Mode) => void;
  onHome: () => void;
  onBack?: () => void;
  onNotes: () => void;
  onResources: () => void;
  children: React.ReactNode;
}) {
  const inFlow = FLOW.some((f) => f.key === step);
  const canSwitchMode = step === "fit" || step === "care";
  return (
    <div className="flex min-h-screen flex-col min-h-[100dvh]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-slate-500 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header
        className="sticky top-0 z-30 border-b border-line bg-paper"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-3">
          <Wordmark onClick={onHome} />
          <div className="flex shrink-0 items-center gap-2">
            {canSwitchMode && <ModeSwitch mode={mode} onChange={onMode} />}
          </div>
        </div>
      </header>

      <CrisisStrip />
      {inFlow && <Progress step={step} />}

      <main id="main" className="relative mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-24 sm:pt-9">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-3 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Icon name="back" className="h-4 w-4" />
            Back
          </button>
        )}
        {children}
      </main>

      <HelpButton step={step} />

      <footer className="border-t border-line bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-7 text-xs leading-relaxed text-faint sm:px-6">
          {step === "landing" ? (
            <p className="text-muted">
              ClearMind Medical is an online psychiatry practice for adults in Texas. We treat ADHD, anxiety,
              depression, bipolar disorder, PTSD, and OCD with psychiatric evaluation and medication management by
              video. We are not an emergency service, and we do not bill Medicare or Medicaid.
            </p>
          ) : (
            <p className="text-muted">
              Not an emergency service. We don&rsquo;t bill Medicare or Medicaid.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href="tel:988" className="inline-flex min-h-[2.75rem] items-center font-medium text-slate-600">988 Lifeline</a>
            <button onClick={onResources} className="inline-flex min-h-[2.75rem] items-center text-slate-600">Mental health resources</button>
            <button onClick={onNotes} className="inline-flex min-h-[2.75rem] items-center text-slate-600">Design notes (for reviewers)</button>
          </div>
          <p className="mt-3">Prototype — no real accounts, appointments, or payments.</p>
        </div>
      </footer>
    </div>
  );
}
