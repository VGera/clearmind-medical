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

type Stage = "pick" | "providers" | "confirm" | "done";

interface Choice {
  providerId: string;
  hours: number;
  date: Date;
}

/** Open times for any provider, excluding one the patient already holds. */
function openTimes(now: Date, providerId: string, exclude?: number) {
  const p = PROVIDERS.find((x) => x.id === providerId);
  const hours = (p?.slotHours ?? []).slice().sort((a, b) => a - b);
  const dates = resolveSlots(now, hours);
  return hours
    .map((h, i) => ({ providerId, hours: h, date: dates[i] }))
    .filter((s) => s.date.getTime() !== exclude);
}

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
  onCommit: (hours: number, providerId: string) => void;
  onMessage: () => void;
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [picked, setPicked] = useState<Choice | null>(null);
  const [booked, setBooked] = useState<Choice | null>(null);

  const provider = PROVIDERS.find((p) => p.id === visit.providerId);
  const who = provider ? titleFor(provider.credential, provider.name) : visit.providerName;
  const firstName = (provider?.name ?? visit.providerName.replace(/^Dr\.\s*/, "")).split(" ")[0];

  const current = visitDate(now, visit.hours);

  /* The time they already hold isn't an "open time" — it's theirs. The rest go
     through resolveSlots, the same helper the booking flow uses, so the pills
     here read in order and can't show the same time twice. */
  /* The time they already hold isn't an "open time" — it's theirs. Comparing
     resolved times rather than raw offsets matters because two offsets can
     clamp onto the same clinic hour. */
  const slots = useMemo(
    () => openTimes(now, visit.providerId, visitDate(now, visit.hours).getTime()),
    [visit.providerId, visit.hours, now],
  );

  const others = useMemo(
    () => PROVIDERS.filter((p) => p.id !== visit.providerId).map((p) => ({ p, times: openTimes(now, p.id) })),
    [visit.providerId, now],
  );

  const pickedProvider = picked ? PROVIDERS.find((p) => p.id === picked.providerId) : undefined;
  const switching = Boolean(picked && picked.providerId !== visit.providerId);
  const bookedProvider = booked ? PROVIDERS.find((p) => p.id === booked.providerId) : provider;

  const commit = () => {
    if (!picked) return;
    /* Store the snapped time as an offset so the visit list shows exactly the
       time on the pill they tapped, not the unsnapped hour. Nothing is
       released until this runs — the old appointment stands through every
       earlier screen. */
    const hours = (picked.date.getTime() - now.getTime()) / 3_600_000;
    setBooked(picked);
    onCommit(hours, picked.providerId);
    setStage("done");
    window.scrollTo({ top: 0 });
  };

  if (stage === "done" && booked) {
    return (
      <div className="rise">
        <Badge tone="sage">
          <Icon name="check" className="h-3.5 w-3.5" />
          Moved
        </Badge>
        <h1 className="mt-3 font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.8rem]">
          You&rsquo;re set for {when(booked.date, now)}
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          With {bookedProvider ? titleFor(bookedProvider.credential, bookedProvider.name) : who}, {visit.minutes} minutes, by video. Your old time is released and we&rsquo;ve texted you the
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

      {stage === "providers" ? (
        <div className="rise mt-5">
          <p className="text-[0.95rem] leading-relaxed text-muted">
            Anyone here can pick up your care. Tap a time to see it before anything changes —{" "}
            <strong className="font-medium text-ink">
              {when(current, now)} with {who} stays booked until you confirm.
            </strong>
          </p>

          <div className="mt-4 space-y-3">
            {others.map(({ p, times }) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={p.name} tint={p.tint} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[1.1rem] leading-snug text-ink">
                      {titleFor(p.credential, p.name)}, {p.credential}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">{p.role} · ★ {p.rating.toFixed(1)}</p>
                    {p.languages.filter((l) => l !== "English").length > 0 && (
                      <p className="mt-2">
                        <Badge tone="sage">
                          <Icon name="chat" className="h-3.5 w-3.5" />
                          Speaks {p.languages.filter((l) => l !== "English").join(" and ")}
                        </Badge>
                      </p>
                    )}
                  </div>
                </div>

                <ul className="mt-3.5 space-y-2">
                  <li className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: p.tint }}
                    />
                    {p.bio}
                  </li>
                </ul>

                <details className="group mt-3">
                  <summary
                    className="inline-flex min-h-[2.75rem] cursor-pointer list-none items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-slate-600"
                    style={{ background: `${p.tint}1a` }}
                  >
                    About {p.name.split(" ")[0]}
                    <Icon name="arrow" className="h-4 w-4 rotate-90 transition group-open:-rotate-90" />
                  </summary>
                  <p
                    className="mt-2.5 rounded-xl2 px-4 py-3.5 text-[0.95rem] leading-relaxed text-ink"
                    style={{ background: `${p.tint}0f` }}
                  >
                    {p.approach}
                  </p>
                </details>

                <div className="mt-4 border-t border-line pt-4">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={`Open times with ${titleFor(p.credential, p.name)}`}
                  >
                    {times.slice(0, 3).map((t) => (
                      <button
                        key={slotId(p.id, t.hours)}
                        type="button"
                        onClick={() => { setPicked(t); setStage("confirm"); window.scrollTo({ top: 0 }); }}
                        aria-label={`${fullSlotLabel(t.date, now)} with ${titleFor(p.credential, p.name)}`}
                        className="min-h-[3rem] whitespace-nowrap rounded-full border border-line bg-panel px-4 text-[0.95rem] text-ink transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {dayLabel(t.date, now)} · {timeLabel(t.date)}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5 sm:flex-row">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => setStage("pick")}>
              <Icon name="back" className="h-4 w-4" />
              Back to {firstName}&rsquo;s times
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" onClick={onKeep}>
              Keep my current time
            </Button>
          </div>
        </div>
      ) : stage === "confirm" && picked ? (
        <Card className="rise mt-5 border-slate-200 bg-slate-50 p-5">
          <h2 className="font-serif text-[1.2rem] leading-snug text-ink">
            {switching && pickedProvider
              ? `Move to ${titleFor(pickedProvider.credential, pickedProvider.name)} on ${when(picked.date, now)}?`
              : `Move it to ${when(picked.date, now)}?`}
          </h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/80">
            Your current visit stays booked until you tap below. Then we&rsquo;ll release{" "}
            {when(current, now).toLowerCase()} and hold the new time. No fee, and you can move it again later.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Button size="lg" className="w-full" onClick={commit}>
              <Icon name="check" className="h-5 w-5" />
              Yes, move my visit
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setStage(switching ? "providers" : "pick"); setPicked(null); }}
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
                    const sel = picked?.providerId === visit.providerId && picked?.hours === h;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setPicked({ providerId: visit.providerId, hours: h, date: d }); setStage("confirm"); }}
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
              That&rsquo;s a reasonable thing to want and you don&rsquo;t have to explain it. Pick a time with
              anyone below and we&rsquo;ll move your visit across — you keep your chart and you don&rsquo;t start
              over. Your current appointment stays booked until you confirm.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => { setStage("providers"); window.scrollTo({ top: 0 }); }}
              >
                <Icon name="spark" className="h-4 w-4" />
                See other providers
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" onClick={onMessage}>
                <Icon name="chat" className="h-4 w-4" />
                Ask the care team
              </Button>
            </div>
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
