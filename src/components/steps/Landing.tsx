"use client";

import React from "react";
import { CARRIERS, CONDITIONS, PRACTICE, RATING, TESTIMONIALS, type Tint } from "@/lib/data";
import { Button, Card, Icon } from "../ui";

const TINTS: Record<Tint, string> = {
  lilac: "bg-tint-lilac text-tint-lilacInk border-tint-lilacInk/15",
  apricot: "bg-tint-apricot text-tint-apricotInk border-tint-apricotInk/15",
  mint: "bg-tint-mint text-tint-mintInk border-tint-mintInk/15",
  sky: "bg-tint-sky text-tint-skyInk border-tint-skyInk/15",
  blush: "bg-tint-blush text-tint-blushInk border-tint-blushInk/15",
  sand: "bg-tint-sand text-tint-sandInk border-tint-sandInk/15",
};

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={score >= i - 0.25 ? "#b9764f" : "#e3e0d8"}>
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function Landing({ onStart }: { onStart: (mode: "form" | "chat") => void }) {
  return (
    <div className="rise">
      {/* A warm panel rather than a flat page. Calm, but not colourless. */}
      <div className="relative -mx-1 overflow-hidden rounded-xl2 border border-tint-lilacInk/10 bg-gradient-to-br from-tint-lilac via-tint-sky/60 to-tint-mint px-5 py-7 sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-tint-apricot/60 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-panel/80 px-3 py-1.5 text-xs font-medium text-tint-mintInk shadow-sm">
            <Icon name="video" className="h-4 w-4" />
            Texas · adults · video visits
          </p>

          <h1 tabIndex={-1} className="mt-5 max-w-sm font-serif text-[2rem] leading-[1.14] text-ink outline-none sm:max-w-lg sm:text-[2.6rem]">
            Psychiatric care, without the wait.
          </h1>
          <p className="mt-4 max-w-sm text-[1.0625rem] leading-relaxed text-ink/75 sm:max-w-md">
            Online psychiatry for adults in Texas — ADHD, anxiety, depression, bipolar, PTSD.
          </p>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-ink/75">
            <Stars score={RATING.score} />
            <span>
              <strong className="font-medium text-ink">{RATING.score}</strong> from {RATING.count} patients
            </span>
          </p>

          {/* The two ways in live inside the panel. Kept outside it, they sat
              62% down the first screen on a phone — below the fold once
              Safari's URL bar is counted. */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => onStart("form")} className="w-full sm:w-auto">
              Start
              <Icon name="arrow" className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onStart("chat")} className="w-full sm:w-auto">
              <Icon name="chat" className="h-5 w-5" />
              Chat instead
            </Button>
          </div>
          <p className="mt-3 text-sm text-ink/70">About five minutes.</p>
        </div>
      </div>

      <h2 className="mb-3 mt-9 text-[1.05rem] font-medium text-ink">What people come to us for</h2>
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.filter((c) => c.id !== "other").map((c) => (
          <span key={c.id} className={`rounded-full border px-3.5 py-2 text-sm font-medium ${TINTS[c.tint]}`}>
            {c.label}
          </span>
        ))}
      </div>


      {/* Reads more like something we mean when it isn't boxed in. */}
      <p className="mt-9 border-l-2 border-tint-lilacInk/40 pl-4 font-serif text-[1.15rem] leading-relaxed text-ink sm:pl-5 sm:text-[1.25rem]">
        Brains work differently — that isn&rsquo;t the thing we&rsquo;re treating. We&rsquo;re here for the parts
        making life harder than it needs to be: the sleep, the focus, the dread, whatever it is for you.
      </p>

      <section className="mt-11" aria-labelledby="voices">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="voices" className="font-serif text-[1.3rem] text-ink">What patients say</h2>
          <p className="text-sm text-muted">{RATING.count} reviews</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {TESTIMONIALS.slice(0, 3).map((t) => (
            <li key={t.name}>
              <figure className={`h-full rounded-xl2 border p-5 ${TINTS[t.tint]}`}>
                <blockquote className="text-[0.95rem] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-3.5 text-xs font-medium">
                  {t.name} · {t.city} · {t.when}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <p className="mt-3.5 text-xs leading-relaxed text-muted">
          Sample reviews for this prototype — written for the demo, not real patients.
        </p>
      </section>

      {/* Logistics, including the two exclusions. They used to sit third from
          the top, which made "we can't bill Medicare or Medicaid" the second
          thing a new visitor read; the fit check already catches those
          patients and hands them real resources. */}
      <Card className="mt-10 p-5">
        <h2 className="text-[1.05rem] font-medium text-ink">Good to know</h2>
        <ul className="mt-3 space-y-2.5">
          {[
            `In-network with ${CARRIERS.filter((c) => c.id !== "other").map((c) => c.short).join(", ")}.`,
            "Most people are seen within three days.",
            "Some providers see patients in Spanish, Hindi, Tamil or German.",
            `Adults in ${PRACTICE.stateNames} only, and we can\u2019t bill Medicare or Medicaid. More states are coming \u2014 if that\u2019s you today, we\u2019ll point you somewhere that can help.`,
            "A short form with your address and history arrives by email after you book.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <Button size="lg" onClick={() => onStart("form")} className="mt-9 w-full sm:w-auto">
        Start
        <Icon name="arrow" className="h-5 w-5" />
      </Button>
    </div>
  );
}
