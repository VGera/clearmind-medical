"use client";

import React, { useEffect, useRef, useState } from "react";
import { PRACTICE, QUESTIONS } from "@/lib/data";
import type { Intake } from "@/lib/types";
import { Button, Card, Icon, Label, StepHeading, inputClass, invalidClass } from "../ui";

const RESEND_SECONDS = 30;

/**
 * The second phase of the details screen, not a screen of its own — one more
 * step in the rail is a step someone can abandon.
 *
 * Six digits in one field: separate boxes are fiddly on a phone and confusing
 * with a screen reader, for the same number of taps.
 */
export function Verify({
  intake,
  patch,
  onContinue,
  onEditPhone,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onContinue: () => void;
  onEditPhone: () => void;
}) {
  const [code, setCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [entered, setEntered] = useState("");
  const [wrong, setWrong] = useState(false);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [sent, setSent] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);

  const where = channel === "sms" ? intake.account.phone || "your phone" : intake.account.email || "your email";

  const check = (value: string) => {
    if (value === code) {
      patch({ phoneVerified: true });
      onContinue();
      return;
    }
    setWrong(true);
    requestAnimationFrame(() => errRef.current?.focus());
  };

  const resend = () => {
    const next = String(Math.floor(100000 + Math.random() * 900000));
    setCode(next);
    setEntered("");
    setWrong(false);
    setLeft(RESEND_SECONDS);
    setSent(true);
    input.current?.focus();
  };

  return (
    <div>
      <StepHeading
        eyebrow="Your details"
        title={QUESTIONS.verify}
        sub={
          <>
            We sent a 6-digit code to <strong className="font-medium text-ink">{where}</strong>. This is the number
            we&rsquo;ll text your appointment reminders to, so we want to be sure it reaches you.
          </>
        }
      />

      <Card className="p-5">
        <Label htmlFor="code">Enter the code</Label>
        <input
          ref={input}
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          aria-invalid={wrong}
          aria-describedby="code-help"
          value={entered}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 6);
            setEntered(d);
            setWrong(false);
            /* Six digits in means they're done — no need to hunt for a button. */
            if (d.length === 6) check(d);
          }}
          className={`${inputClass} text-center font-serif text-[1.75rem] tracking-[0.5em] ${wrong ? invalidClass : ""}`}
        />
        <p id="code-help" className="mt-2.5 text-sm text-muted">
          It arrives in a few seconds. We&rsquo;ll move on by itself once you&rsquo;ve typed all six.
        </p>

        {wrong && (
          <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
            That code doesn&rsquo;t match. Check the last message, or send a new one.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => check(entered)}>
            Verify
            <Icon name="check" className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={left > 0}
            onClick={resend}
          >
            {left > 0 ? `Send a new code in ${left}s` : "Send a new code"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {sent && left === RESEND_SECONDS ? "New code sent." : ""}
        </p>
      </Card>

      <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
        <button onClick={onEditPhone} className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-600">
          <Icon name="back" className="h-4 w-4" />
          Back — that&rsquo;s not my number
        </button>
        {channel === "sms" && (
          <button
            onClick={() => { setChannel("email"); resend(); }}
            className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-600"
          >
            <Icon name="link" className="h-4 w-4" />
            I can&rsquo;t get texts — email it instead
          </button>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-medium text-ink">Why we ask</h2>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
          A verified number is how we text your visit link 30 minutes before, and remind you the day before. If we
          can&rsquo;t reach you, you miss the appointment — and that&rsquo;s the thing we most want to avoid. Nothing
          else is sent to this number, and you can turn reminders off any time.
        </p>
        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
          Stuck? Call us at{" "}
          <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
            {PRACTICE.phone}
          </a>{" "}
          and we&rsquo;ll finish the booking with you.
        </p>
      </Card>

      {/* Prototype affordance — a real build would never show the code. */}
      <p className="mt-6 rounded-xl border border-dashed border-line bg-panel px-4 py-3 text-xs text-muted">
        Prototype: your code is <strong className="font-mono text-ink">{code}</strong>
      </p>
    </div>
  );
}
