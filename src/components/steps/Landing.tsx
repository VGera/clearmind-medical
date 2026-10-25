"use client";

import React from "react";
import { CARRIERS, CONDITIONS, PRACTICE } from "@/lib/data";
import { Button, Card, Icon } from "../ui";

export function Landing({ onStart }: { onStart: (mode: "form" | "chat") => void }) {
  return (
    <div className="rise">
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1.5 text-xs font-medium text-sage-600">
          <Icon name="video" className="h-4 w-4" />
          Texas · adults · video visits
        </p>
        
      </div>

      <h1 tabIndex={-1} className="mt-5 max-w-sm font-serif text-[2rem] leading-[1.14] text-ink outline-none sm:max-w-lg sm:text-[2.6rem]">
        Psychiatric care, without the wait.
      </h1>
      <p className="mt-4 max-w-sm text-[1.0625rem] leading-relaxed text-muted sm:max-w-md">
        Online psychiatry for adults in Texas — ADHD, anxiety, depression, bipolar, PTSD.
      </p>
      <p className="mt-2 max-w-sm text-[1.0625rem] leading-relaxed text-muted">
        A few short questions, or a chat. About five minutes.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => onStart("form")} className="w-full sm:w-auto">
          Start
          <Icon name="arrow" className="h-5 w-5" />
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onStart("chat")} className="w-full sm:w-auto">
          <Icon name="chat" className="h-5 w-5" />
          Chat instead
        </Button>
      </div>

      <Card className="mt-8 p-5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 shrink-0 text-slate-500"><Icon name="mic" className="h-5 w-5" /></span>
          <p className="text-[0.95rem] leading-relaxed text-muted">
            When you get to the part where you describe what&rsquo;s going on, you can{" "}
            <strong className="font-medium text-ink">tap the microphone and just talk</strong> instead of typing.
            Same in the chat.
          </p>
        </div>
      </Card>

      <Card className="mt-3 border-clay-500/25 bg-clay-100/40 p-5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 shrink-0 text-clay-600"><Icon name="info" className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-[0.95rem] leading-relaxed text-muted">
              For now we see adults in <strong className="font-medium text-ink">{PRACTICE.stateNames}</strong> only,
              and we can&rsquo;t bill <strong className="font-medium text-ink">Medicare or Medicaid</strong>.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              More states are coming. If that&rsquo;s you today, we&rsquo;ll point you somewhere that can help.
            </p>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-9 text-[1.05rem] font-medium text-ink">What we treat</h2>
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.filter((c) => c.id !== "other").map((c) => (
          <span key={c.id} className="rounded-full border border-line bg-panel px-3.5 py-2 text-sm text-muted">
            {c.label}
          </span>
        ))}
      </div>

      <p className="mt-7 text-sm leading-relaxed text-muted">
        In-network with {CARRIERS.filter((c) => c.id !== "other").map((c) => c.short).join(", ")}.
        Most people are seen within three days. Some of our providers see patients in Spanish, Hindi, Tamil or German.
        A short form with your address and history arrives by email after you book.
      </p>

      <Button size="lg" onClick={() => onStart("form")} className="mt-7 w-full sm:w-auto">
        Start
        <Icon name="arrow" className="h-5 w-5" />
      </Button>
    </div>
  );
}
