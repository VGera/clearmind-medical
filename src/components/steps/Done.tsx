"use client";

import React, { useState } from "react";
import { PRACTICE, PROVIDERS } from "@/lib/data";
import { detectCrisis } from "@/lib/parse";
import type { Intake } from "@/lib/types";
import { CarePlan } from "../CarePlan";
import { Button, Card, Icon } from "../ui";
import { AppointmentSummary } from "./Payment";
import { fullSlotLabel } from "./Match";

function icsFor(intake: Intake, start: Date): string {
  const p = PROVIDERS.find((x) => x.id === intake.providerId);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(start.getTime() + 50 * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClearMind Medical//Intake//EN",
    "BEGIN:VEVENT",
    `UID:cmp-${Date.now()}@clearmindmedical.example`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Psychiatry visit with ${p?.name ?? "your provider"} (ClearMind Medical)`,
    "DESCRIPTION:Video visit. Your link arrives by email and text 30 minutes before.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function Done({
  intake,
  patch,
  onRestart,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onRestart: () => void;
}) {
  const [now] = useState(() => new Date());
  const start = intake.slotISO ? new Date(intake.slotISO) : null;
  const when = start ? fullSlotLabel(start, now) : "";
  const first = intake.account.legalFirst || "";
  const flagged = intake.crisisDisclosed || detectCrisis(intake.symptoms);

  const spoken = `You're all set${first ? `, ${first}` : ""}. Your visit is ${when}. We've emailed the details, and we'll text your link half an hour before. That was the hard part.`;

  const download = () => {
    if (!start) return;
    const blob = new Blob([icsFor(intake, start)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clearmind-medical-visit.ics";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="rise">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <Icon name="check" className="h-6 w-6" />
        </span>
        
      </div>

      <h1 tabIndex={-1} className="mt-5 font-serif text-[1.75rem] leading-tight text-ink outline-none sm:text-[2.1rem]">
        You&rsquo;re all set{first ? `, ${first}` : ""}.
      </h1>
      <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-muted">
        That was the hard part. We emailed the details, and we&rsquo;ll text your visit link to{" "}
        <strong className="font-medium text-ink">{intake.account.phone}</strong> 30 minutes before.
      </p>

      <div className="mt-7">
        <AppointmentSummary intake={intake} now={now} />
      </div>

      {start && (
        <div className="mt-3.5">
          <CarePlan intake={intake} start={start} />
        </div>
      )}

      <div className="mt-3.5 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={download} className="w-full sm:w-auto">
          <Icon name="clock" className="h-4 w-4" />
          Add to calendar
        </Button>
        <a
          href="/portal"
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-panel px-5 text-[0.9375rem] font-medium text-slate-600 transition hover:bg-slate-50 sm:w-auto"
        >
          <Icon name="video" className="h-4 w-4" />
          Open my portal
        </a>
        <Button variant="ghost" onClick={onRestart} className="w-full sm:w-auto">Start over (demo)</Button>
      </div>

      {flagged && (
        <Card className="mt-6 border-alert-500/30 bg-alert-100/50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-alert-500"><Icon name="heart" className="h-5 w-5" /></span>
            <div>
              <h2 className="font-medium text-ink">You don&rsquo;t have to wait for the appointment</h2>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                A nurse on our team reads your intake before your visit. If you want to talk to someone sooner,
                call us at{" "}
                <a href={PRACTICE.phoneHref} className="font-semibold text-slate-600 underline decoration-current underline-offset-2">
                  {PRACTICE.phone}
                </a>{" "}
                — or{" "}
                <a href="tel:988" className="font-semibold text-alert-500 underline decoration-current underline-offset-2">988</a>, any hour.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-5">
        <h2 className="font-medium text-ink">Before your first visit</h2>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
          A short form is in your inbox — your address, pharmacy and medical history, about five minutes. Your
          provider reads it beforehand, so you won&rsquo;t start from the beginning.
        </p>
      </Card>

      <div className="mt-7 rounded-xl border border-dashed border-line bg-panel px-4 py-3.5">
        <p className="text-xs text-muted">Prototype — step through the plan:</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            onClick={() =>
              patch({
                visitsCompleted: Math.min(intake.visitsCompleted + 1, 4),
                intakeFormDone: true,
                summarySent: intake.visitsCompleted + 1 >= 1,
              })
            }
            className="min-h-[2.75rem] rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600"
          >
            Complete next visit
          </button>
          <button
            onClick={() => patch({ intakeFormDone: !intake.intakeFormDone })}
            className="min-h-[2.75rem] rounded-full border border-line bg-panel px-4 text-sm text-muted"
          >
            Toggle intake form
          </button>
          <button
            onClick={() => patch({ visitsCompleted: 0, intakeFormDone: false, summarySent: false })}
            className="min-h-[2.75rem] rounded-full border border-line bg-panel px-4 text-sm text-muted"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="mt-7 text-[0.95rem] leading-relaxed text-muted">
        Need someone before then? Call us at{" "}
        <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          {PRACTICE.phone}
        </a>, or{" "}
        <a href="tel:988" className="font-medium text-slate-600 underline decoration-current underline-offset-2">988</a>{" "}
        and the{" "}
        <a href="tel:18006624357" className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          SAMHSA helpline
        </a>{" "}
        — both free, all night.
      </p>
    </div>
  );
}
