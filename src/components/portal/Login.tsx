"use client";

import React, { useEffect, useRef, useState } from "react";
import { PRACTICE } from "@/lib/data";
import { formatPhone } from "@/lib/parse";
import { Button, Card, Icon, Label, TextField, inputClass, invalidClass } from "../ui";

/**
 * A code to the phone, with an email link as the way out.
 *
 * WCAG 2.2 counts "read a code and retype it" as a cognitive function test,
 * which is exactly the thing this population finds hardest — so the code field
 * accepts paste, autofills from the SMS on both platforms, submits itself on
 * the sixth digit, and never expires while you're looking at it. The email
 * link exists for anyone who'd rather not transcribe anything at all.
 */
export function Login({ onIn }: { onIn: () => void }) {
  const [phase, setPhase] = useState<"ask" | "code" | "emailed">("ask");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [expected, setExpected] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const phoneOk = phone.replace(/\D/g, "").length === 10;

  useEffect(() => {
    if (phase === "code") codeRef.current?.focus();
  }, [phase]);

  const sendCode = () => {
    setBusy(true);
    setTimeout(() => {
      setExpected(String(Math.floor(100000 + Math.random() * 900000)));
      setBusy(false);
      setPhase("code");
    }, 600);
  };

  const check = (value: string) => {
    if (value === expected) { onIn(); return; }
    setWrong(true);
    requestAnimationFrame(() => errRef.current?.focus());
  };

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <div className="mb-7 flex items-center gap-2.5">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#eef3f5" stroke="#b9ced7" />
          <path d="M8 22c3.5 0 4.5-5 8-5s4.5-5 8-5" fill="none" stroke="#2d5468" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="12" r="2.4" fill="#5f8871" />
        </svg>
        <span className="font-serif text-[1.0625rem] text-ink">
          ClearMind <span className="text-slate-500">Medical</span>
        </span>
      </div>

      {phase === "ask" && (
        <>
          <h1 className="font-serif text-[1.7rem] leading-tight text-ink">Sign in</h1>
          <p className="mt-2.5 text-[1rem] leading-relaxed text-muted">
            We&rsquo;ll text you a code. No password to remember.
          </p>
          <Card className="mt-6 p-5">
            <Label htmlFor="pl-phone">Your mobile number</Label>
            <TextField
              id="pl-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(512) 555-0134"
              value={phone}
              onChange={(v) => setPhone(formatPhone(v.replace(/\D/g, "")))}
            />
            <Button size="lg" disabled={!phoneOk || busy} onClick={sendCode} className="mt-4 w-full">
              {busy ? "Sending…" : "Text me a code"}
              {!busy && <Icon name="arrow" className="h-5 w-5" />}
            </Button>
          </Card>

          <button
            onClick={() => setPhase("emailed")}
            className="mt-5 inline-flex min-h-[2.75rem] items-center gap-2 text-sm text-slate-600 underline decoration-current underline-offset-2"
          >
            <Icon name="link" className="h-4 w-4" />
            I&rsquo;d rather get a link by email
          </button>
        </>
      )}

      {phase === "code" && (
        <>
          <h1 className="font-serif text-[1.7rem] leading-tight text-ink">Check your phone</h1>
          <p className="mt-2.5 text-[1rem] leading-relaxed text-muted">
            We sent a 6-digit code to <strong className="font-medium text-ink">{phone}</strong>.
          </p>
          <Card className="mt-6 p-5">
            <Label htmlFor="pl-code">Enter the code</Label>
            <input
              ref={codeRef}
              id="pl-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              aria-invalid={wrong}
              value={code}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(d);
                setWrong(false);
                if (d.length === 6) check(d);
              }}
              className={`${inputClass} text-center font-serif text-[1.75rem] tracking-[0.5em] ${wrong ? invalidClass : ""}`}
            />
            <p className="mt-2.5 text-sm text-muted">It signs you in by itself once all six are in.</p>
            {wrong && (
              <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
                That code doesn&rsquo;t match. Check the last message, or send a new one.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => check(code)} className="w-full sm:w-auto">Sign in</Button>
              <Button size="lg" variant="secondary" onClick={sendCode} className="w-full sm:w-auto">Send a new code</Button>
            </div>
          </Card>
          <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
            <button onClick={() => setPhase("ask")} className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-600">
              <Icon name="back" className="h-4 w-4" /> Use a different number
            </button>
            <button onClick={() => setPhase("emailed")} className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-600">
              <Icon name="link" className="h-4 w-4" /> Email me a link instead
            </button>
          </div>
          <p className="mt-6 rounded-xl border border-dashed border-line bg-panel px-4 py-3 text-xs text-muted">
            Prototype: your code is <strong className="font-mono text-ink">{expected}</strong>
          </p>
        </>
      )}

      {phase === "emailed" && (
        <>
          <h1 className="font-serif text-[1.7rem] leading-tight text-ink">Check your email</h1>
          <p className="mt-2.5 text-[1rem] leading-relaxed text-muted">
            We sent a link that signs you in with one tap — nothing to type or remember.
          </p>
          <Card className="mt-6 border-tint-skyInk/15 bg-tint-sky p-5">
            <p className="text-[0.95rem] leading-relaxed text-tint-skyInk">
              Open it on this device and you&rsquo;ll go straight in. The link works once and lasts 15 minutes.
            </p>
          </Card>
          <Button size="lg" onClick={onIn} className="mt-5 w-full">
            Prototype: open the link
            <Icon name="arrow" className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setPhase("ask")}
            className="mt-5 inline-flex min-h-[2.75rem] items-center gap-2 text-sm text-slate-600"
          >
            <Icon name="back" className="h-4 w-4" /> Text me a code instead
          </button>
        </>
      )}

      <p className="mt-9 text-sm leading-relaxed text-muted">
        Stuck? Call us at{" "}
        <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          {PRACTICE.phone}
        </a>
        . If you&rsquo;re in crisis, call or text{" "}
        <a href="tel:988" className="font-medium text-slate-600 underline decoration-current underline-offset-2">988</a>.
      </p>
    </main>
  );
}
