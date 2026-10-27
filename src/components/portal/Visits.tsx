"use client";

import React, { useState } from "react";
import { PRACTICE } from "@/lib/data";
import {
  JOIN_WINDOW_MINUTES, type Visit, visitDate, when,
} from "@/lib/portal/mock";
import { Badge, Button, Card, Icon } from "../ui";

function minutesUntil(now: Date, v: Visit): number {
  return (visitDate(now, v.hours).getTime() - now.getTime()) / 60000;
}

/** Joining is the whole point of the screen, so it gets the primary button. */
function JoinBlock({ v, now }: { v: Visit; now: Date }) {
  const mins = minutesUntil(now, v);
  const open = mins <= JOIN_WINDOW_MINUTES;
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <div className="mt-5 border-t border-line pt-4">
      {open ? (
        <Button size="lg" className="w-full sm:w-auto">
          <Icon name="video" className="h-5 w-5" />
          Join your visit
        </Button>
      ) : (
        <>
          <p className="text-[0.95rem] text-muted">
            The join button opens {JOIN_WINDOW_MINUTES} minutes before. We&rsquo;ll text you the link too.
          </p>
          <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setChecking(true);
                setTimeout(() => { setChecking(false); setChecked(true); }, 1400);
              }}
            >
              <Icon name="mic" className="h-4 w-4" />
              {checking ? "Checking…" : "Test my camera and mic"}
            </Button>
            {checked && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
                <Icon name="check" className="h-4 w-4" /> Camera, microphone and connection all look good
              </span>
            )}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-muted">
            Worth doing once, now, rather than discovering a problem at the start of your appointment.
          </p>
        </>
      )}
    </div>
  );
}

function CancelFlow({ v, onCancel, onReschedule }: { v: Visit; onCancel: () => void; onReschedule: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-line bg-panel px-4 text-sm text-muted transition hover:border-slate-300 hover:text-ink"
      >
        Cancel
      </button>
    );
  }
  return (
    <Card className="rise mt-1 w-full border-slate-200 bg-slate-50 p-4">
      <p className="text-[0.95rem] leading-relaxed text-ink">Cancel this visit?</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        No fee — it&rsquo;s more than 24 hours away. If the time is the problem rather than the appointment,
        moving it keeps your place.
      </p>
      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={onReschedule}>
          Move it instead
        </Button>
        <Button
          className="w-full !bg-alert-500 hover:!bg-alert-500/90 sm:w-auto"
          onClick={() => { onCancel(); setOpen(false); }}
        >
          Yes, cancel it
        </Button>
        <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
    </Card>
  );
}

export function Visits({
  visits,
  now,
  onOpen,
  onCancel,
  onMessage,
}: {
  visits: Visit[];
  now: Date;
  onOpen: (v: Visit) => void;
  onCancel: (id: string) => void;
  onMessage: () => void;
}) {
  const upcoming = visits.filter((v) => v.status === "upcoming");
  const past = visits.filter((v) => v.status !== "upcoming");

  return (
    <div className="space-y-7">
      <section aria-labelledby="upcoming">
        <h2 id="upcoming" className="mb-3 font-serif text-[1.25rem] text-ink">Coming up</h2>
        {upcoming.length === 0 ? (
          <Card className="p-5">
            <p className="text-[0.95rem] leading-relaxed text-muted">
              Nothing booked right now. Your provider can set up the next one, or message them and they&rsquo;ll
              sort it.
            </p>
            <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={onMessage}>
              <Icon name="chat" className="h-4 w-4" /> Message your provider
            </Button>
          </Card>
        ) : (
          upcoming.map((v) => (
            <Card key={v.id} className="border-slate-200 p-5 shadow-lift">
              <Badge tone="slate">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {v.kind}
              </Badge>
              <p className="mt-3 font-serif text-[1.3rem] leading-snug text-ink">
                {when(visitDate(now, v.hours), now)}
              </p>
              <p className="mt-1 text-[0.95rem] text-muted">
                {v.providerName} · video · {v.minutes} minutes
              </p>

              <JoinBlock v={v} now={now} />

              <div className="mt-5 flex flex-col flex-wrap items-start gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onOpen(v)}>
                  <Icon name="clock" className="h-4 w-4" /> Reschedule
                </Button>
                <CancelFlow v={v} onCancel={() => onCancel(v.id)} onReschedule={() => onOpen(v)} />
                <button
                  onClick={onMessage}
                  className="inline-flex min-h-[2.75rem] items-center gap-2 px-1 text-sm text-slate-600"
                >
                  <Icon name="chat" className="h-4 w-4" /> Message {v.providerName.split(" ").slice(-1)[0]}
                </button>
              </div>
            </Card>
          ))
        )}
      </section>

      <section aria-labelledby="past">
        <h2 id="past" className="mb-3 font-serif text-[1.25rem] text-ink">Past visits</h2>
        <div className="space-y-3">
          {past.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{when(visitDate(now, v.hours), now)}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {v.kind} · {v.providerName}
                  </p>
                </div>
                {v.status === "cancelled" ? (
                  <Badge tone="neutral">Cancelled</Badge>
                ) : (
                  <Badge tone="sage">
                    <Icon name="check" className="h-3.5 w-3.5" /> Completed
                  </Badge>
                )}
              </div>
              {v.summary && (
                <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={() => onOpen(v)}>
                  See the summary
                  <Icon name="arrow" className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <p className="text-sm leading-relaxed text-muted">
        Need to change something quickly? Call us at{" "}
        <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          {PRACTICE.phone}
        </a>
        .
      </p>
    </div>
  );
}
