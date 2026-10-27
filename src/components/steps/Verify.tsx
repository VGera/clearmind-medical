"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PRACTICE, QUESTIONS } from "@/lib/data";
import type { Intake } from "@/lib/types";
import { toE164, verifyAutofill, verifyCheckSms, verifySendSms, verifySilent } from "@/lib/verified/mock";
import { Button, Card, Icon, Label, StepHeading, TextField, inputClass, invalidClass } from "../ui";

const RESEND_SECONDS = 30;

/**
 * 1-Click Verify — the second phase of the details screen.
 *
 * Verified waterfalls three channels, so the UI has to handle all three:
 *   autofill — the carrier returns the number, nothing to type
 *   silent   — the number the patient typed is confirmed without an SMS
 *   sms      — a code, the slow path
 *
 * Which channel a device gets isn't ours to choose, so none of them is treated
 * as the "real" one. Whatever happens, the patient can always fall through to
 * a code, or call us.
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
  const [stage, setStage] = useState<"probing" | "autofilled" | "code">("probing");
  const [entered, setEntered] = useState("");
  const [wrong, setWrong] = useState(false);
  const [expected, setExpected] = useState("");
  const [channelPhone, setChannelPhone] = useState("");
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);

  const toSms = useCallback(async (phone: string) => {
    const { demoCode } = await verifySendSms(phone);
    setExpected(demoCode);
    setLeft(RESEND_SECONDS);
    setStage("code");
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  /* Run the waterfall once, on arrival. */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const auto = await verifyAutofill(undefined, intake.account.phone);
      if (auto) {
        setChannelPhone(auto.phone);
        setStage("autofilled");
        return;
      }
      const silent = await verifySilent(intake.account.phone);
      if (silent) {
        patch({ phoneVerified: true, verifyChannel: "silent" });
        setChannelPhone(silent.phone);
        setStage("autofilled");
        return;
      }
      await toSms(intake.account.phone);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "code" || left <= 0) return;
    const t = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, left]);

  const pretty = (e164: string) => {
    const d = e164.replace(/\D/g, "").slice(-10);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const check = async (value: string) => {
    setBusy(true);
    const res = await verifyCheckSms(intake.account.phone, value, expected);
    setBusy(false);
    if (res) {
      patch({ phoneVerified: true, verifyChannel: "sms" });
      onContinue();
      return;
    }
    setWrong(true);
    requestAnimationFrame(() => errRef.current?.focus());
  };

  /* ---------------- probing ---------------- */

  if (stage === "probing") {
    return (
      <div>
        <StepHeading eyebrow="Your details" title="One moment" sub="Checking your number with your carrier." />
        <Card className="p-5">
          <p className="inline-flex items-center gap-2 text-[0.95rem] text-slate-600" aria-live="polite">
            <span className="dot-1 h-2 w-2 rounded-full bg-slate-400" />
            <span className="dot-2 h-2 w-2 rounded-full bg-slate-400" />
            <span className="dot-3 h-2 w-2 rounded-full bg-slate-400" />
            This usually takes a few seconds. No text needed if we can confirm it directly.
          </p>
        </Card>
      </div>
    );
  }

  /* ---------------- autofill / silent ---------------- */

  if (stage === "autofilled") {
    const phone = channelPhone || toE164(intake.account.phone);
    return (
      <div>
        <StepHeading
          eyebrow="Your details"
          title="Is this your number?"
          sub="Your carrier confirmed it, so there's no code to wait for. This is where your appointment reminders will go."
        />
        <Card className="p-5">
          <p className="font-serif text-[1.5rem] text-ink">{pretty(phone)}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                patch({
                  phoneVerified: true,
                  verifyChannel: intake.verifyChannel ?? "autofill",
                  account: { ...intake.account, phone: pretty(phone) },
                });
                onContinue();
              }}
            >
              Yes, that&rsquo;s me
              <Icon name="check" className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => toSms(intake.account.phone)}>
              Text me a code instead
            </Button>
          </div>
          <button
            onClick={onEditPhone}
            className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 text-sm text-slate-600 underline decoration-current underline-offset-2"
          >
            <Icon name="back" className="h-4 w-4" />
            Use a different number
          </button>
        </Card>
        <Why />
      </div>
    );
  }

  /* ---------------- sms code ---------------- */

  return (
    <div>
      <StepHeading
        eyebrow="Your details"
        title={QUESTIONS.verify}
        sub={
          <>
            We sent a 6-digit code to{" "}
            <strong className="font-medium text-ink">{intake.account.phone || "your phone"}</strong>. This is the
            number we&rsquo;ll text your appointment reminders to.
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
            if (d.length === 6) void check(d);
          }}
          className={`${inputClass} text-center font-serif text-[1.75rem] tracking-[0.5em] ${wrong ? invalidClass : ""}`}
        />
        <p id="code-help" className="mt-2.5 text-sm text-muted">
          We&rsquo;ll move on by itself once you&rsquo;ve typed all six.
        </p>

        {wrong && (
          <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
            That code doesn&rsquo;t match. Check the last message, or send a new one.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" disabled={busy} className="w-full sm:w-auto" onClick={() => void check(entered)}>
            {busy ? "Checking…" : "Verify"}
            {!busy && <Icon name="check" className="h-5 w-5" />}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={left > 0}
            onClick={() => void toSms(intake.account.phone)}
          >
            {left > 0 ? `Send a new code in ${left}s` : "Send a new code"}
          </Button>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
        <button onClick={onEditPhone} className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-600">
          <Icon name="back" className="h-4 w-4" />
          Back — that&rsquo;s not my number
        </button>
      </div>

      <Why />

      <p className="mt-6 rounded-xl border border-dashed border-line bg-panel px-4 py-3 text-xs text-muted">
        Prototype: your code is <strong className="font-mono text-ink">{expected}</strong>
      </p>
    </div>
  );
}

function Why() {
  return (
    <Card className="mt-6 p-5">
      <h2 className="font-medium text-ink">Why we ask</h2>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
        A confirmed number is how we text your visit link 30 minutes before, and remind you the day before — so
        the appointment doesn&rsquo;t quietly slip past. Nothing else is sent to this number, and you can turn
        reminders off any time.
      </p>
      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
        Stuck? Call us at{" "}
        <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          {PRACTICE.phone}
        </a>{" "}
        and we&rsquo;ll finish the booking with you.
      </p>
    </Card>
  );
}
