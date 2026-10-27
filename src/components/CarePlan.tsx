"use client";

import React from "react";
import { CARE_PLAN } from "@/lib/data";
import type { Intake } from "@/lib/types";
import { Card, Icon } from "./ui";

function when(start: Date, offsetDays: number): string {
  const d = new Date(start.getTime() + offsetDays * 86_400_000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Booking isn't the finish line; the first visit is, and then the next three.
 * The count is the headline because that's the thing a patient can hold on to,
 * and every step is named so "2 of 4" means something concrete.
 */
export function CarePlan({ intake, start }: { intake: Intake; start: Date }) {
  const total = CARE_PLAN.length;
  const done = Math.min(intake.visitsCompleted, total);
  const nextIndex = done < total ? done : -1;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="font-serif text-[1.3rem] text-ink">Your first 90 days</h2>
        <p className="text-sm text-muted">
          <strong className="font-serif text-[1.3rem] text-ink">{done}</strong> of {total} visits
        </p>
      </div>

      {/* Segmented, so progress is countable at a glance rather than a vague bar. */}
      <div className="mt-3.5 flex gap-1.5" role="img" aria-label={`${done} of ${total} visits complete`}>
        {CARE_PLAN.map((v, i) => (
          <span
            key={v.key}
            className={`h-2 flex-1 rounded-full transition ${
              i < done ? "bg-sage-500" : i === nextIndex ? "bg-slate-300" : "bg-line"
            }`}
          />
        ))}
      </div>

      <ol className="mt-5 space-y-3">
        {CARE_PLAN.map((v, i) => {
          const complete = i < done;
          const next = i === nextIndex;
          return (
            <li key={v.key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  complete
                    ? "border-sage-500 bg-sage-500 text-white"
                    : next
                      ? "border-slate-500 bg-slate-50 text-slate-600"
                      : "border-line bg-panel text-faint"
                }`}
              >
                {complete ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`font-medium ${complete || next ? "text-ink" : "text-muted"}`}>{v.label}</span>
                  {next && (
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {i === 0 ? "booked" : "next"}
                    </span>
                  )}
                  {complete && <span className="text-xs text-sage-600">done</span>}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {v.detail} · {complete ? "" : i === 0 ? "" : "around "}
                  {when(start, v.offsetDays)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* The things that happen between visits, so there's something to tick
          off before the first appointment arrives. */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {[
          { label: "Intake form", done: intake.intakeFormDone },
          { label: "Prescription sent", done: intake.prescriptionSent },
        ].map((s) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              s.done ? "border-sage-500/30 bg-sage-100 text-sage-600" : "border-line bg-panel text-muted"
            }`}
          >
            {s.done ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
            {s.label}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Nothing here expires, and missing one doesn&rsquo;t undo anything. If a date stops working, move it — that
        counts as keeping the plan, not breaking it.
      </p>
    </Card>
  );
}
