"use client";

import React, { useState } from "react";
import { PRACTICE, PROVIDERS } from "@/lib/data";
import { detectCrisis } from "@/lib/parse";
import type { Intake } from "@/lib/types";
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

export function Done({ intake, onRestart }: { intake: Intake; onRestart: () => void }) {
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
      <p className="mt-3 max-w-sm text-[1rem] leading-relaxed text-muted">
        That was the hard part. We emailed the details, and we&rsquo;ll text your visit link to{" "}
        <strong className="font-medium text-ink">{intake.account.phone}</strong> 30 minutes before.
      </p>

      <div className="mt-7">
        <AppointmentSummary intake={intake} now={now} />
      </div>

      <div className="mt-3.5 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={download} className="w-full sm:w-auto">
          <Icon name="clock" className="h-4 w-4" />
          Add to calendar
        </Button>
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

      <h2 className="mb-3.5 mt-9 text-[1.05rem] font-medium text-ink">Next</h2>
      <ol className="space-y-3">
        {[
          { t: "A short form, in your inbox", d: "Your address, pharmacy and medical history. About five minutes." },
          { t: "Your visit", d: "Fifty minutes by video. Somewhere private is enough." },
          { t: "A plan you leave with", d: "Prescriptions go out the same day, if they make sense." },
        ].map((s, i) => (
          <li key={s.t}>
            <Card className="p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 font-serif text-sm text-slate-600">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium text-ink">{s.t}</h3>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{s.d}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

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
