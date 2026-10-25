"use client";

import React, { useRef, useState } from "react";
import { PRACTICE, QUESTIONS } from "@/lib/data";
import { formatPhone } from "@/lib/parse";
import type { Account as Acct, Intake } from "@/lib/types";
import { Button, Card, Icon, Label, StepHeading, TextField, inputClass, invalidClass } from "../ui";
import { Verify } from "./Verify";

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-7 first:border-0 first:pt-0">
      <h2 className="text-[1.05rem] font-medium text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Check({
  id,
  checked,
  onChange,
  children,
  invalid = false,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1 text-[0.95rem] leading-relaxed text-muted">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid}
        className={`mt-0.5 h-5 w-5 shrink-0 rounded text-slate-500 focus:ring-slate-300 ${
          invalid ? "border-alert-500" : "border-line"
        }`}
      />
      <span>{children}</span>
    </label>
  );
}

export function Account({
  intake,
  patch,
  onContinue,
  onElsewhere,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onContinue: () => void;
  onElsewhere: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  /* Verification is the second half of this screen, not a separate step. */
  const [phase, setPhase] = useState<"details" | "verify">(
    intake.phoneVerified ? "verify" : "details",
  );
  const [maxDob] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  });
  const a = intake.account;
  const set = (p: Partial<Acct>) => patch({ account: { ...a, ...p } });

  /* The chat can skip the age question rather than nagging, so this is where
     eligibility is actually established. */
  const dobAge = (() => {
    if (!a.dob) return null;
    const d = new Date(a.dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
    return age;
  })();
  const underage = dobAge !== null && dobAge < 18;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email);
  const phoneOk = a.phone.replace(/\D/g, "").length === 10;
  const fields: { id: string; ok: boolean; name: string }[] = [
    { id: "legalFirst", ok: Boolean(a.legalFirst.trim()), name: "first name" },
    { id: "legalLast", ok: Boolean(a.legalLast.trim()), name: "last name" },
    { id: "dob", ok: Boolean(a.dob) && !underage, name: "date of birth" },
    { id: "email", ok: emailOk, name: "email" },
    { id: "phone", ok: phoneOk, name: "mobile number" },
    { id: "c1", ok: a.consentTelehealth, name: "the video care consent" },
    { id: "c2", ok: a.consentPrivacy, name: "the privacy acknowledgement" },
  ];
  const missing = fields.filter((f) => !f.ok).map((f) => f.name);
  const ready = missing.length === 0;

  const errRef = useRef<HTMLParagraphElement>(null);
  const err = (bad: boolean) => (touched && bad ? invalidClass : "");
  const bad = (id: string) => touched && !fields.find((f) => f.id === id)?.ok;

  const submit = () => {
    setTouched(true);
    if (ready) { setPhase("verify"); return; }
    const first = fields.find((f) => !f.ok);
    requestAnimationFrame(() => {
      const el = first ? document.getElementById(first.id) : null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        el.focus();
      } else {
        errRef.current?.focus();
      }
    });
  };

  if (phase === "verify") {
    return (
      <Verify
        intake={intake}
        patch={patch}
        onContinue={onContinue}
        onEditPhone={() => {
          setPhase("details");
          requestAnimationFrame(() => document.getElementById("phone")?.focus());
        }}
      />
    );
  }

  return (
    <div>
      <StepHeading
        eyebrow="Your account"
        title={QUESTIONS.account}
        sub="Your time is held while you fill this in."
      />

      {underage && (
        <Card className="rise mb-7 border-slate-200 bg-slate-50 p-5" role="status">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-slate-500"><Icon name="heart" className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="font-medium text-ink">We only see adults 18 and over</h2>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                Care for someone younger needs a clinician trained for it, and you deserve the right person.
                Here&rsquo;s how to find one.
              </p>
              <Button
                className="mt-4 w-full sm:w-auto"
                onClick={() => {
                  patch({ adult: false });
                  onElsewhere();
                }}
              >
                Where to go instead
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-7">
        <Group title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="legalFirst">First name</Label>
              <TextField id="legalFirst" aria-invalid={bad("legalFirst")} value={a.legalFirst} onChange={(v) => set({ legalFirst: v })} autoComplete="given-name" className={err(!a.legalFirst.trim())} />
            </div>
            <div>
              <Label htmlFor="legalLast">Last name</Label>
              <TextField id="legalLast" aria-invalid={bad("legalLast")} value={a.legalLast} onChange={(v) => set({ legalLast: v })} autoComplete="family-name" className={err(!a.legalLast.trim())} />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <input
                id="dob"
                type="date"
                aria-invalid={bad("dob")}
                value={a.dob}
                min="1900-01-01"
                max={maxDob}
                onChange={(e) => set({ dob: e.target.value })}
                className={`${inputClass} ${err(!a.dob || underage)}`}
              />
            </div>
            <div>
              <Label htmlFor="pronouns" hint="optional">Pronouns</Label>
              <TextField id="pronouns" value={a.pronouns} onChange={(v) => set({ pronouns: v })} placeholder="she/her, he/him, they/them" />
            </div>
          </div>
        </Group>

        <Group title="How to reach you">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <TextField id="email" aria-invalid={bad("email")} type="email" inputMode="email" autoComplete="email" value={a.email} onChange={(v) => set({ email: v })} placeholder="you@example.com" className={err(!emailOk)} />
            </div>
            <div>
              <Label htmlFor="phone">Mobile</Label>
              <TextField id="phone" aria-invalid={bad("phone")} type="tel" inputMode="tel" autoComplete="tel" value={a.phone} onChange={(v) => set({ phone: formatPhone(v.replace(/\D/g, "")) })} placeholder="(512) 555-0134" className={err(!phoneOk)} />
            </div>
          </div>
        </Group>

        <section className="border-t border-line pt-7" aria-labelledby="consent-h">
          <h2 id="consent-h" className="text-[1.05rem] font-medium text-ink">Consent</h2>
          <Card className={`mt-4 space-y-2 p-5 ${touched && (!a.consentTelehealth || !a.consentPrivacy) ? invalidClass : ""}`}>
            <Check id="c1" checked={a.consentTelehealth} onChange={(v) => set({ consentTelehealth: v })} invalid={bad("c1")}>
              I agree to care by video, and I know this isn&rsquo;t emergency care.
            </Check>
            <Check id="c2" checked={a.consentPrivacy} onChange={(v) => set({ consentPrivacy: v })} invalid={bad("c2")}>
              I&rsquo;ve read the{" "}
              <a
                href="#privacy-notice"
                onClick={(e) => { e.preventDefault(); setShowNotice(true); }}
                className="font-medium text-slate-600 underline decoration-current underline-offset-2"
              >
                privacy notice
              </a>.
            </Check>
            <Check id="c3" checked={a.consentTexts} onChange={(v) => set({ consentTexts: v })}>
              Text me reminders. <span className="text-muted">Optional.</span>
            </Check>
          </Card>
          {showNotice && (
            <Card className="rise mt-3 p-5">
              <h3 className="font-medium text-ink">Notice of Privacy Practices (summary)</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Your records are protected health information under HIPAA. We use them to treat you, to bill your
                plan, and to run the practice. We don&rsquo;t sell them or use them for advertising. We share them
                only with your written permission, except where the law requires it — including a serious, imminent
                threat to your safety. You can ask to see your records, correct them, or get a copy at any time by
                calling {PRACTICE.phone}.
              </p>
            </Card>
          )}
        </section>
      </div>

      <div className="mt-9 border-t border-line pt-7">
        <Button size="lg" className="w-full sm:w-auto" onClick={submit}>
          Continue
          <Icon name="arrow" className="h-5 w-5" />
        </Button>
        {touched && !ready && (
          <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
            Still needed: {missing.join(", ")}.
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          <Icon name="shield" className="mr-1 inline h-4 w-4 align-[-3px] text-slate-500" />
          Private and encrypted. When you continue we&rsquo;ll text a code to your number, so your appointment
          reminders reach you. Your address, pharmacy and history come later, in a short form we email you.
        </p>
      </div>
    </div>
  );
}
