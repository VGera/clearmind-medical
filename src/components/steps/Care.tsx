"use client";

import React, { useEffect, useRef, useState } from "react";
import { CONDITIONS, NEEDS, PRACTICE, QUESTIONS } from "@/lib/data";
import { detectCrisis } from "@/lib/parse";
import type { Intake, Need } from "@/lib/types";
import { Button, Card, Chip, Icon, OptionCard, StepHeading } from "../ui";
import { DictateTextarea } from "../VoiceBits";

function CrisisNote() {
  return (
    <Card className="rise mt-4 border-alert-500/40 bg-alert-100/50 p-5" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-alert-500"><Icon name="heart" className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h3 className="font-medium text-ink">Thank you for telling us</h3>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
            If you&rsquo;re thinking about hurting yourself, please{" "}
            <a href="tel:988" className="font-semibold text-alert-500 underline decoration-current underline-offset-2">
              call or text 988
            </a>{" "}
            now — free, and open all night. If you&rsquo;re in danger, call 911.
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
            You can keep going here too. A nurse reads this before your visit, and you can call us any time at{" "}
            <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
              {PRACTICE.phone}
            </a>.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Section({
  id,
  text,
  note,
  children,
}: {
  id: string;
  text: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 border-t border-line pt-8" aria-labelledby={id}>
      <div className="mb-4">
        <h2 id={id} className="font-serif text-[1.25rem] leading-snug text-ink">{text}</h2>
      </div>
      {note && <p className="-mt-2 mb-4 text-sm leading-relaxed text-muted">{note}</p>}
      {children}
    </section>
  );
}

export function Care({
  intake,
  patch,
  onContinue,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onContinue: () => void;
}) {
  const hasWhat = intake.conditions.length > 0 || intake.symptoms.trim().length > 2;
  const ready = hasWhat && intake.need !== null;
  const [touched, setTouched] = useState(false);
  const errRef = useRef<HTMLParagraphElement>(null);

  const submit = () => {
    setTouched(true);
    if (ready) { onContinue(); return; }
    const anchor = document.getElementById(hasWhat ? "q-need" : "q-conditions");
    anchor?.scrollIntoView({ block: "center", behavior: "auto" });
    requestAnimationFrame(() => errRef.current?.focus());
  };

  /* Speak whichever question is live, not only the first on the screen. */

  /* Debounced, so the alert doesn't appear mid-word while someone is still
     writing. It is also only a response — never a block. */
  const [crisis, setCrisis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const hit = detectCrisis(intake.symptoms);
      setCrisis(hit);
      if (hit && !intake.crisisDisclosed) patch({ crisisDisclosed: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [intake.symptoms, intake.crisisDisclosed, patch]);

  const toggle = (id: string) => {
    const next = intake.conditions.includes(id)
      ? intake.conditions.filter((c) => c !== id)
      : [...intake.conditions, id];
    patch({ conditions: next });
  };

  return (
    <div>
      <StepHeading
        eyebrow="Your care"
        title={QUESTIONS.conditions}
        sub="Pick whatever fits. More than one is fine."
      />

      <div id="q-conditions" className="flex flex-wrap gap-2" role="group" aria-label="What you're looking for help with">
        {CONDITIONS.map((c) => (
          <Chip key={c.id} selected={intake.conditions.includes(c.id)} onClick={() => toggle(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <Section
        id="q-symptoms"
        text={QUESTIONS.symptoms}
        note={
          <>
            Optional, and a sentence is plenty. A nurse on our team reads this before your visit — nothing else is
            done with it.
          </>
        }
      >
        <DictateTextarea
          id="symptoms"
          target="care-symptoms"
          rows={4}
          value={intake.symptoms}
          onChange={(v) => patch({ symptoms: v })}
          placeholder="I can't focus, and I lie awake until 3am…"
        />
        {crisis && <CrisisNote />}
      </Section>

      <Section id="q-need" text={QUESTIONS.need}>
        <div className="space-y-2.5" role="radiogroup" aria-labelledby="q-need">
          {NEEDS.map((n) => (
            <OptionCard
              key={n.id}
              selected={intake.need === n.id}
              title={n.label}
              detail={n.detail}
              onClick={() => patch({ need: n.id as Need })}
            />
          ))}
        </div>
      </Section>

      <div className="mt-9 border-t border-line pt-7">
        <Button size="lg" onClick={submit} className="w-full sm:w-auto">
          Find my match
          <Icon name="arrow" className="h-5 w-5" />
        </Button>
        {touched && !ready && (
          <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
            {hasWhat
              ? "One more: pick what would help most."
              : "Tell us what's going on first — tap anything above, or describe it in your own words."}
          </p>
        )}
      </div>
    </div>
  );
}
