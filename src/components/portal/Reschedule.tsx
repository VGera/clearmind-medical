"use client";

import React, { useMemo, useState } from "react";
import { PRACTICE, PROVIDERS, resolveSlots, slotId } from "@/lib/data";
import { type Visit, visitDate, when } from "@/lib/portal/mock";
import { dayLabel, fullSlotLabel, timeLabel, titleFor } from "../steps/Match";
import { Avatar, Badge, Button, Card, Icon } from "../ui";

/**
 * Moving a visit is the pressure valve for the cancel button: most people who
 * cancel only have a problem with the time. So it reuses the booking flow's own
 * slot logic (same provider, same pills, same labels) and never dead-ends —
 * every screen keeps "Keep my current time" within reach.
 */

type Stage = "pick" | "confirm" | "done";

export function Reschedule({
  visit,
  now,
  onKeep,
  onCommit,
  onMessage,
}: {
  visit: Visit;
  now: Date;
  /** The way out that isn't cancelling. */
  onKeep: () => void;
  /** Hours from `now`, already snapped to a real clinic slot. */
  onCommit: (hours: number) => void;
  onMessage: () => void;
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [picked, setPicked] = useState<number | null>(null);
  const [booked, setBooked] = useState<number | null>(null);

  const provider = PROVIDERS.find((p) => p.id === visit.providerId);
  const who = provider ? titleFor(provider.credential, provider.name) : visit.providerName;
  const firstName = (provider?.name ?? visit.providerName.replace(/^Dr\.\s*/, "")).split(" ")[0];

  const current = visitDate(now, visit.hours);

  /* The time they already hold isn't an "open time" — it's theirs. The rest go
     through resolveSlots, the same helper the booking flow uses, so the pills
     here read in order and can't show the same time twice. */
  const slots = useMemo(() => {
    const hours = (provider?.slotHours ?? []).sort((a, b) => a - b);
    const dates = resolveSlots(now, hours);
    /* Compare the resolved times, not the raw offsets: two different offsets
       can clamp onto the same clinic hour, which is how the time you already
       have ended up offered as an alternative to itself. */
    const booked = visitDate(now, visit.hours).getTime();
    return hours
      .map((h, i) => ({ hours: h, date: dates[i] }))
      .filter((s) => s.date.getTime() !== booked);
  }, [provider, visit.hours, now]);

  const dateFor = (h: number) => slots.find((s) => s.hours === h)?.date ?? null;
  const pickedDate = picked === null ? null : dateFor(picked);
  const bookedDate = booked === null ? null : dateFor(booked);

  const commit = () => {
    if (picked === null) return;
    const snapped = dateFor(picked);
    if (!snapped) return;
    /* Store the snapped time as an offset so the visit list shows exactly the
       time on the pill they tapped, not the unsnapped hour. */
    const hours = (snapped.getTime() - now.getTime()) / 3_600_000;
    setBooked(picked);
    onCommit(hours);
    setStage("done");
    window.scrollTo({ top: 0 });
  };

  if (stage === "done" && bookedDate) {
    return (
      <div className="rise">
        <Badge tone="sage">
          <Icon name="check" className="h-3.5 w-3.5" />
          Moved
        </Badge>
        <h1 className="mt-3 font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.8rem]">
          You&rsquo;re set for {when(bookedDate, now)}
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          With {who}, {visit.minutes} minutes, by video. Your old time is released and we&rsquo;ve texted you the
          new one.
        </p>

        <Card className="mt-6 p-5">
          <h2 className="font-medium text-ink">Before the visit</h2>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
            The join button opens 15 minutes before. Worth testing your camera and microphone once beforehand —
            it&rsquo;s on your visit, under &ldquo;Coming up&rdquo;.
          </p>
        </Card>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" onClick={onKeep}>
            Back to my visits
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onMessage}>
            <Icon name="chat" className="h-4 w-4" />
            Message {firstName}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onKeep}
        className="mb-5 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <Icon name="back" className="h-4 w-4" />
        All visits
      </button>

      <h1 className="font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.8rem]">Move your visit</h1>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        Same provider, same {visit.minutes}-minute visit — just a different time. Nothing changes until you
        confirm.
      </p>

      <Card className="mt-5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Booked now</p>
        <p className="mt-2 font-serif text-[1.3rem] leading-snug text-ink">{when(current, now)}</p>
        <div className="mt-3 flex items-center gap-3">
          {provider && <Avatar name={provider.name} tint={provider.tint} size={40} />}
          <p className="min-w-0 text-[0.95rem] text-muted">
            {who} · {visit.kind} · {visit.minutes} minutes
          </p>
        </div>
      </Card>

      {stage === "confirm" && pickedDate ? (
        <Card className="rise mt-5 border-slate-200 bg-slate-50 p-5">
          <h2 className="font-serif text-[1.2rem] leading-snug text-ink">Move it to {when(pickedDate, now)}?</h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/80">
            We&rsquo;ll release {when(current, now).toLowerCase()} and hold the new time for you. No fee, and you
            can move it again later.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Button size="lg" className="w-full" onClick={commit}>
              <Icon name="check" className="h-5 w-5" />
              Yes, move my visit
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setStage("pick"); setPicked(null); }}
            >
              Pick a different time
            </Button>
            <Button variant="ghost" className="w-full" onClick={onKeep}>
              Keep my current time
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="font-serif text-[1.25rem] text-ink">Open times with {who}</h2>
            {slots.length === 0 ? (
              <Card className="mt-3 p-5">
                <p className="text-[0.95rem] leading-relaxed text-muted">
                  {firstName} has nothing else open this week. Message the care team and they&rsquo;ll find you
                  something — or call us on {PRACTICE.phone} and we&rsquo;ll sort it while you&rsquo;re on the
                  line.
                </p>
                <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={onMessage}>
                  <Icon name="chat" className="h-4 w-4" />
                  Message the care team
                </Button>
              </Card>
            ) : (
              <>
                <p className="mt-1.5 text-[0.95rem] text-muted">Tap a time to see it before anything changes.</p>
                <div className="mt-3.5 flex flex-wrap gap-2" role="group" aria-label={`Open times with ${who}`}>
                  {slots.map(({ hours: h, date: d }) => {
                    const id = slotId(visit.providerId, h);
                    const sel = picked === h;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setPicked(h); setStage("confirm"); }}
                        aria-pressed={sel}
                        aria-label={`${fullSlotLabel(d, now)} with ${who}`}
                        className={`min-h-[3rem] whitespace-nowrap rounded-full border px-4 text-[0.95rem] transition ${
                          sel
                            ? "border-slate-500 bg-slate-500 font-medium text-white"
                            : "border-line bg-panel text-ink hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {dayLabel(d, now)} · {timeLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <Card className="mt-6 p-5">
            <h2 className="font-medium text-ink">Would you rather see someone else?</h2>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
              That&rsquo;s a reasonable thing to want and you don&rsquo;t have to explain it. Message the care team
              and they&rsquo;ll match you with another provider — you keep your chart and you don&rsquo;t start
              over.
            </p>
            <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={onMessage}>
              <Icon name="chat" className="h-4 w-4" />
              Ask about a different provider
            </Button>
          </Card>

          <div className="mt-6 border-t border-line pt-5">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onKeep}>
              Keep my current time
            </Button>
            <p className="mt-3 text-sm leading-relaxed text-muted">Rather talk it through?</p>
            <a
              href={PRACTICE.phoneHref}
              className="mt-2 inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-slate-200 bg-panel px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Icon name="phone" className="h-4 w-4" />
              Call us at {PRACTICE.phone}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
