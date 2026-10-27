"use client";

import React from "react";
import { PRACTICE } from "@/lib/data";
import { type Visit, visitDate, when } from "@/lib/portal/mock";
import { Button, Card, Icon } from "../ui";

/**
 * What you and your provider agreed, and what happens next — not the clinical
 * note. Psychiatric notes carry formulations and differential diagnoses that
 * land very differently read alone on a phone than they do in a conversation,
 * so the note stays out of here and the screen says so rather than leaving a
 * patient to wonder what's being withheld.
 */
export function VisitDetail({ visit, now, onBack, onMessage }: {
  visit: Visit;
  now: Date;
  onBack: () => void;
  onMessage: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="mb-5 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="back" className="h-4 w-4" />
        All visits
      </button>

      <h1 className="font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.8rem]">
        {when(visitDate(now, visit.hours), now)}
      </h1>
      <p className="mt-1.5 text-[0.95rem] text-muted">
        {visit.kind} · {visit.providerName} · {visit.minutes} minutes
      </p>

      {visit.summary ? (
        <>
          <Card className="mt-6 p-5">
            <h2 className="font-medium text-ink">What you agreed</h2>
            <ul className="mt-3 space-y-2.5">
              {visit.summary.agreed.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-ink">
                  <span className="mt-0.5 shrink-0 text-sage-500"><Icon name="check" className="h-4 w-4" /></span>
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="mt-3 border-tint-skyInk/15 bg-tint-sky p-5">
            <h2 className="font-medium text-ink">What happens next</h2>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-tint-skyInk">{visit.summary.next}</p>
          </Card>

          <Card className="mt-3 p-5">
            <h2 className="font-medium text-ink">About your clinical notes</h2>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
              Your provider&rsquo;s own notes aren&rsquo;t shown here. They&rsquo;re written for the next
              clinician who sees you and read strangely on their own — that&rsquo;s a deliberate choice, not
              something being kept from you. You have every right to them: ask your provider to go through them
              with you, or request a copy on {PRACTICE.phone}.
            </p>
            <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={onMessage}>
              <Icon name="chat" className="h-4 w-4" />
              Ask about this visit
            </Button>
          </Card>
        </>
      ) : (
        <Card className="mt-6 p-5">
          <p className="text-[0.95rem] leading-relaxed text-muted">
            The summary appears here after your visit, usually the same day.
          </p>
        </Card>
      )}
    </div>
  );
}
