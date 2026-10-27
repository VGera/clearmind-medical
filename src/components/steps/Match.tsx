"use client";

import React, { useMemo, useState } from "react";
import { CARRIERS, CONDITIONS, PRACTICE, QUESTIONS, resolveSlot, slotId } from "@/lib/data";
import { headline, rankProviders, type Ranked } from "@/lib/match";
import type { Intake } from "@/lib/types";
import { Avatar, Badge, Button, Card, Icon, StepHeading } from "../ui";

function dayLabel(d: Date, now: Date): string {
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const days = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fullSlotLabel(d: Date, now: Date): string {
  return `${dayLabel(d, now)} at ${timeLabel(d)}`;
}

export function titleFor(credential: string, name: string): string {
  return `${credential === "MD" || credential === "DO" ? "Dr. " : ""}${name}`;
}

function ProviderCard({
  r,
  now,
  badge,
  tone,
  selectedSlot,
  onPick,
}: {
  r: Ranked;
  now: Date;
  badge?: string;
  tone?: "slate" | "sage";
  selectedSlot: string | null;
  onPick: (id: string, slot: string) => void;
}) {
  const [all, setAll] = useState(false);
  const p = r.provider;
  const hours = all ? p.slotHours : p.slotHours.slice(0, 3);
  const who = titleFor(p.credential, p.name);
  const otherLangs = p.languages.filter((l) => l !== "English");

  return (
    <Card className={`${badge ? "border-slate-200 shadow-lift" : ""} p-5`}>
      {badge && (
        <div className="mb-4">
          <Badge tone={tone ?? "slate"}>
            <Icon name={tone === "sage" ? "clock" : "spark"} className="h-3.5 w-3.5" />
            {badge}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        <Avatar name={p.name} tint={p.tint} size={52} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[1.15rem] leading-snug text-ink">
            {who}, {p.credential}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {p.role} · ★ {p.rating.toFixed(1)}
          </p>
          {otherLangs.length > 0 && (
            <p className="mt-2">
              <Badge tone="sage">
                <Icon name="chat" className="h-3.5 w-3.5" />
                Speaks {otherLangs.join(" and ")}
              </Badge>
            </p>
          )}
        </div>
      </div>

      <p className="mt-3.5 text-[0.95rem] leading-relaxed text-muted">{p.bio}</p>

      {badge ? (
        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{p.approach}</p>
      ) : (
        <details className="mt-2.5 group">
          <summary className="inline-flex min-h-[2.75rem] cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-600">
            About {p.name.split(" ")[0]}
            <Icon name="arrow" className="h-4 w-4 rotate-90 transition group-open:-rotate-90" />
          </summary>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{p.approach}</p>
        </details>
      )}

      {r.reasons.length > 0 && (
        <ul className="mt-3.5 space-y-1.5">
          {r.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-[0.95rem] text-ink">
              <span className="mt-0.5 shrink-0 text-sage-500"><Icon name="check" className="h-4 w-4" /></span>
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Open times with ${who}`}>
          {hours.map((h) => {
            const d = resolveSlot(now, h);
            const id = slotId(p.id, h);
            const picked = selectedSlot === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick(p.id, id)}
                aria-pressed={picked}
                aria-label={`${fullSlotLabel(d, now)} with ${who}`}
                className={`min-h-[3rem] whitespace-nowrap rounded-full border px-4 text-[0.95rem] transition ${
                  picked
                    ? "border-slate-500 bg-slate-500 font-medium text-white"
                    : "border-line bg-panel text-ink hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {dayLabel(d, now)} · {timeLabel(d)}
              </button>
            );
          })}
          {!all && p.slotHours.length > 3 && (
            <button
              type="button"
              onClick={() => setAll(true)}
              className="min-h-[3rem] px-3 text-[0.95rem] text-slate-600 underline decoration-current underline-offset-2"
            >
              More times
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function HoldBar({
  label,
  providerName,
  onContinue,
  onRelease,
}: {
  label: string;
  providerName: string;
  onContinue: () => void;
  onRelease: () => void;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-paper px-4 py-3 sm:mx-0 sm:mt-7 sm:rounded-xl2 sm:border sm:px-5 sm:shadow-lift"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.95rem] font-medium text-ink">
            {label} · {providerName}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            We&rsquo;re holding this time for you.{" "}
            <button onClick={onRelease} className="min-h-[2.75rem] underline decoration-current underline-offset-2 hover:text-ink">
              Change
            </button>
          </p>
        </div>
        <Button size="lg" onClick={onContinue} className="w-full shrink-0 sm:w-auto">
          Continue
          <Icon name="arrow" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export function Match({
  intake,
  patch,
  onContinue,
  onEditCare,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onContinue: () => void;
  onEditCare: () => void;
}) {
  const [now] = useState(() => new Date());
  const [showMore, setShowMore] = useState(false);

  const ranked = useMemo(() => rankProviders(intake), [intake]);
  const { recommended, soonest, rest } = useMemo(() => headline(ranked), [ranked]);

  /* Only call the second card "soonest" when it actually is. Otherwise the two
     badges tell the patient the opposite of what the times say. */
  const secondIsSooner = Boolean(soonest && soonest.nextHours < recommended.nextHours);
  const secondBadge = soonest
    ? secondIsSooner
      ? `Soonest — ${fullSlotLabel(resolveSlot(now, soonest.nextHours), now).toLowerCase()}`
      : "Also a strong fit"
    : "";

  const conditionText = intake.conditions
    .filter((c) => c !== "other")
    .map((c) => CONDITIONS.find((x) => x.id === c)?.label)
    .filter(Boolean)
    .join(" · ");
  const carrierText = intake.selfPay
    ? "Paying directly"
    : CARRIERS.find((c) => c.id === intake.carrier)?.short ?? "Your plan";


  const pick = (providerId: string, slot: string) => {
    const hours = Number(slot.split(":")[1]);
    patch({ providerId, slotId: slot, slotISO: resolveSlot(now, hours).toISOString() });
  };

  const heldProvider = ranked.find((r) => r.provider.id === intake.providerId)?.provider;
  const heldLabel = intake.slotISO ? fullSlotLabel(new Date(intake.slotISO), now) : "";

  return (
    <div className={intake.slotId ? "pb-[9rem] sm:pb-0" : ""}>
      <StepHeading
        eyebrow="Your match"
        title={QUESTIONS.match}
        sub="Pick a time that works."
      />

      <div className="mb-6 flex items-start justify-between gap-3 text-sm">
        <p className="line-clamp-2 min-w-0 text-muted">
          {[conditionText, carrierText].filter(Boolean).join(" · ")}
        </p>
        <button
          onClick={onEditCare}
          className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-1.5 px-1 text-slate-600"
        >
          <Icon name="pencil" className="h-4 w-4" />
          Edit
        </button>
      </div>

      <h2 className="sr-only">Providers with openings</h2>
      <div className="space-y-3.5">
        <ProviderCard
          r={recommended}
          now={now}
          badge="Recommended for you"
          tone="slate"
          selectedSlot={intake.slotId}
          onPick={pick}
        />
        {soonest && (
          <ProviderCard
            r={soonest}
            now={now}
            badge={secondBadge}
            tone={secondIsSooner ? "sage" : "slate"}
            selectedSlot={intake.slotId}
            onPick={pick}
          />
        )}
      </div>


      {rest.length > 0 && !showMore && (
        <Button variant="secondary" onClick={() => setShowMore(true)} className="mt-5 w-full sm:w-auto">
          Find more ({rest.length})
        </Button>
      )}

      {showMore && (
        <div className="rise mt-6 space-y-3.5">
          {rest.map((r) => (
            <div key={r.provider.id}>
              <ProviderCard r={r} now={now} selectedSlot={intake.slotId} onPick={pick} />
              {!r.inNetwork && !intake.selfPay && (
                <p className="mt-1.5 px-1 text-xs text-muted">
                  Not in-network with {carrierText} — you&rsquo;d pay the direct rate (${PRACTICE.selfPay.intake}).
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {intake.slotId && heldProvider && (
        <HoldBar
          label={heldLabel}
          providerName={titleFor(heldProvider.credential, heldProvider.name)}
          onContinue={onContinue}
          onRelease={() => patch({ providerId: null, slotId: null, slotISO: null })}
        />
      )}
    </div>
  );
}
