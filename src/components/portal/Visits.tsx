"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PRACTICE } from "@/lib/data";
import {
  JOIN_WINDOW_MINUTES, type Visit, visitDate, when,
} from "@/lib/portal/mock";
import { Badge, Button, Card, Icon } from "../ui";
import { classifyMediaError, MediaTrouble, mediaBlocked, type MediaFail } from "./VideoVisit";

function minutesUntil(now: Date, v: Visit): number {
  return (visitDate(now, v.hours).getTime() - now.getTime()) / 60000;
}

/** Joining is the whole point of the screen, so it gets the primary button. */
function JoinBlock({ v, now, onJoin }: { v: Visit; now: Date; onJoin: () => void }) {
  const mins = minutesUntil(now, v);
  /* Also bounded below. The window used to be open-ended in the past, so a
     visit three hours gone still offered a live Join button. */
  const missed = mins < -(v.minutes + 15);
  const canJoin = mins <= JOIN_WINDOW_MINUTES && !missed;
  const [checking, setChecking] = useState(false);
  const [fail, setFail] = useState<MediaFail | null>(null);
  const [found, setFound] = useState<{ cam: string; mic: string } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (vidRef.current) vidRef.current.srcObject = null;
    setFound(null);
  }, []);

  /* The check turns a real camera on, so it goes off again when this unmounts. */
  useEffect(() => () => release(), [release]);

  /* The preview element only exists once there's something to show. */
  useEffect(() => {
    if (found && vidRef.current && streamRef.current) vidRef.current.srcObject = streamRef.current;
  }, [found]);

  const check = async () => {
    const blocked = mediaBlocked();
    if (blocked) { setFail(blocked); return; }
    setChecking(true);
    setFail(null);
    try {
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        /* Asking for both at once means a camera-only block reports as both
           being blocked. Retry audio alone so we can tell the patient which
           half actually works. */
        const name = (err as DOMException)?.name;
        if (name !== "NotAllowedError" && name !== "NotFoundError") throw err;
        s = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const cam = s.getVideoTracks()[0];
      const mic = s.getAudioTracks()[0];
      if (!mic) {
        s.getTracks().forEach((t) => t.stop());
        setFail("missing");
        return;
      }
      streamRef.current = s;
      /* Report the devices the browser actually handed us, not a reassurance. */
      setFound({
        cam: cam ? cam.label || "Your camera" : "",
        mic: mic.label || "Your microphone",
      });
    } catch (e) {
      setFail(classifyMediaError(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-4">
      {canJoin ? (
        <Button size="lg" className="w-full sm:w-auto" onClick={onJoin}>
          <Icon name="video" className="h-5 w-5" />
          Join your visit
        </Button>
      ) : (
        <>
          <p className="text-[0.95rem] text-muted">
            The join button opens {JOIN_WINDOW_MINUTES} minutes before. We&rsquo;ll text you the link too.
          </p>
          {!found && (
            <div className="mt-3.5">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => void check()} disabled={checking}>
                <Icon name="mic" className="h-4 w-4" />
                {checking ? "Checking…" : "Test my camera and mic"}
              </Button>
            </div>
          )}

          {fail && (
            <div className="mt-3.5">
              <MediaTrouble kind={fail} onRetry={() => void check()} />
            </div>
          )}

          {found && (
            <div className="rise mt-3.5">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
                <Icon name="check" className="h-4 w-4" /> Camera and microphone are both working
              </p>
              <div className="mt-2.5 max-w-[14rem] overflow-hidden rounded-xl2 border border-line bg-slate-700">
                {/* muted + playsInline + autoPlay, or mobile browsers won't render it */}
                <video
                  ref={vidRef}
                  muted
                  playsInline
                  autoPlay
                  aria-label="Your camera, live"
                  className="aspect-video w-full scale-x-[-1] object-cover"
                />
              </div>
              <dl className="mt-2.5 space-y-1 text-sm text-muted">
                <div className="flex gap-1.5">
                  <dt className="font-medium text-ink">Camera:</dt>
                  <dd className="min-w-0 break-words">
                    {found.cam || "blocked for this site — your microphone still works"}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="font-medium text-ink">Microphone:</dt>
                  <dd className="min-w-0 break-words">{found.mic}</dd>
                </div>
              </dl>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                That&rsquo;s you, live. When you join you&rsquo;ll also get a level meter to check your voice
                registers.
              </p>
              <Button variant="secondary" className="mt-3 w-full sm:w-auto" onClick={release}>
                Done — switch my camera off
              </Button>
            </div>
          )}

          <p className="mt-2.5 text-xs leading-relaxed text-muted">
            Worth doing once, now, rather than discovering a problem at the start of your appointment.
          </p>
        </>
      )}
    </div>
  );
}

function CancelFlow({
  v,
  now,
  onCancel,
  onReschedule,
}: {
  v: Visit;
  now: Date;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const [open, setOpen] = useState(false);
  /* This sentence used to be a static string asserting "more than 24 hours
     away" on every visit, including one five hours out. Saying something
     untrue about money on the screen whose job is to be non-punitive is worse
     than saying nothing. */
  const hoursAway = minutesUntil(now, v) / 60;
  const lateFee = hoursAway < 24 && hoursAway > 0;
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
        {lateFee ? (
          <>
            It&rsquo;s less than 24 hours away, so cancelling carries a $
            {PRACTICE.selfPay.followUp} fee &mdash;{" "}
            <strong className="font-medium text-ink">moving it instead is free</strong>, and keeps your place.
          </>
        ) : hoursAway <= 0 ? (
          <>
            This time has already passed. Moving it is free, and your provider would rather you did that than
            start again.
          </>
        ) : (
          <>
            No fee &mdash; it&rsquo;s more than 24 hours away. If the time is the problem rather than the
            appointment, moving it keeps your place.
          </>
        )}
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
  onReschedule,
  onJoin,
}: {
  visits: Visit[];
  now: Date;
  onOpen: (v: Visit) => void;
  onCancel: (id: string) => void;
  onMessage: () => void;
  onReschedule: (v: Visit) => void;
  onJoin: (v: Visit) => void;
}) {
  const upcoming = visits.filter((v) => v.status === "upcoming");
  /* A visit cancelled for next Tuesday is not a past visit. It went under a
     heading reading "Past visits", which told the patient their care was
     behind them. */
  const cancelledAhead = visits.filter(
    (v) => v.status === "cancelled" && minutesUntil(now, v) > 0,
  );
  const past = visits.filter(
    (v) => v.status !== "upcoming" && !cancelledAhead.includes(v),
  );

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

              <JoinBlock v={v} now={now} onJoin={() => onJoin(v)} />

              <div className="mt-5 flex flex-col flex-wrap items-start gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onReschedule(v)}>
                  <Icon name="clock" className="h-4 w-4" /> Reschedule
                </Button>
                <CancelFlow v={v} now={now} onCancel={() => onCancel(v.id)} onReschedule={() => onReschedule(v)} />
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

      {cancelledAhead.length > 0 && (
        <section aria-labelledby="cancelled">
          <h2 id="cancelled" className="mb-3 font-serif text-[1.25rem] text-ink">Cancelled</h2>
          <div className="space-y-3">
            {cancelledAhead.map((v) => (
              <Card key={v.id} className="p-5">
                <p className="font-serif text-[1.1rem] leading-snug text-ink">
                  {when(visitDate(now, v.hours), now)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {v.kind} &middot; {v.providerName} &middot; cancelled
                </p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                  Nothing is lost &mdash; your chart and your provider stay the same. Pick a new time whenever
                  you&rsquo;re ready.
                </p>
                <Button className="mt-4 w-full sm:w-auto" onClick={() => onReschedule(v)}>
                  Book a new time
                  <Icon name="arrow" className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

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
