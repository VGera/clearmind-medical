"use client";

import React, { useRef, useState } from "react";
import { CARRIERS, PRACTICE, PROVIDERS, QUESTIONS } from "@/lib/data";
import { maskMemberId, patientCost } from "@/lib/verified/mock";
import type { Intake } from "@/lib/types";
import { Avatar, Button, Card, Icon, Label, StepHeading, TextField, inputClass, invalidClass } from "../ui";
import { fullSlotLabel, titleFor } from "./Match";

export function AppointmentSummary({ intake, now }: { intake: Intake; now: Date }) {
  const p = PROVIDERS.find((x) => x.id === intake.providerId);
  if (!p || !intake.slotISO) return null;
  const when = fullSlotLabel(new Date(intake.slotISO), now);
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={p.name} tint={p.tint} size={48} />
        <div className="min-w-0">
          <p className="font-medium text-ink">{titleFor(p.credential, p.name)}, {p.credential}</p>
          <p className="mt-1.5 inline-flex items-center gap-2 text-[0.95rem] font-medium text-slate-600">
            <Icon name="clock" className="h-4 w-4" />
            {when}
          </p>
          <p className="mt-1 text-sm text-muted">Video visit · 50 minutes</p>
        </div>
      </div>
    </Card>
  );
}

export function Payment({
  intake,
  patch,
  onConfirm,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onConfirm: () => void;
}) {
  const [now] = useState(() => new Date());
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", zip: "" });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);


  const [deferMember, setDeferMember] = useState(false);
  const carrier = CARRIERS.find((c) => c.id === intake.carrier);
  const elig = intake.eligibility;
  const cost = patientCost(elig);
  const isSelfPay = intake.selfPay || intake.otherPayer === "selfpay";
  const needsMember = !isSelfPay && !deferMember;

  const digits = card.number.replace(/\D/g, "");
  const cardOk = digits.length >= 15 && digits.length <= 16;
  const expOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(card.exp);
  const cvcOk = /^\d{3,4}$/.test(card.cvc);
  const zipOk = /^\d{5}$/.test(card.zip);
  const memberOk = !needsMember || intake.insuranceSource === "autofill" || intake.memberId.trim().length >= 5;

  const fields = [
    { id: "memberId", ok: memberOk, name: "member ID" },
    { id: "cardNumber", ok: cardOk, name: "card number" },
    { id: "exp", ok: expOk, name: "expiry" },
    { id: "cvc", ok: cvcOk, name: "security code" },
    { id: "billZip", ok: zipOk, name: "billing ZIP" },
  ];
  const missing = fields.filter((f) => !f.ok).map((f) => f.name);
  const ready = missing.length === 0;

  const errRef = useRef<HTMLParagraphElement>(null);
  const errCls = (b: boolean) => (touched && b ? invalidClass : "");
  const bad = (id: string) => touched && !fields.find((f) => f.id === id)?.ok;

  const submit = () => {
    setTouched(true);
    if (!ready) {
      const first = fields.find((f) => !f.ok);
      requestAnimationFrame(() => {
        const el = first ? document.getElementById(first.id) : null;
        if (el) { el.scrollIntoView({ block: "center", behavior: "auto" }); el.focus(); }
        else errRef.current?.focus();
      });
      return;
    }
    setBusy(true);
    setTimeout(onConfirm, 700);
  };

  return (
    <div>
      <StepHeading
        eyebrow="Payment"
        title={QUESTIONS.payment}
        sub="We just keep a card on file."
      />

      <AppointmentSummary intake={intake} now={now} />

      <Card className="mt-3.5 p-5">
        <dl className="space-y-2.5 text-[0.95rem]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Today</dt>
            <dd className="font-serif text-[1.35rem] text-ink">$0</dd>
          </div>
          {isSelfPay ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">After your first visit</dt>
                <dd className="font-medium text-ink">${PRACTICE.selfPay.intake}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Follow-ups</dt>
                <dd className="font-medium text-ink">${PRACTICE.selfPay.followUp}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">
                  {cost.confident ? "Your share, after the visit" : `Your ${carrier?.short ?? "plan"} copay, after the visit`}
                </dt>
                <dd className="font-medium text-ink">{cost.text}</dd>
              </div>
              {elig && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Plan</dt>
                  <dd className="text-right text-ink">
                    {elig.eligibility.plan.name}
                    {elig.eligibility.plan.groupNumber && (
                      <span className="block text-xs text-muted">Group {elig.eligibility.plan.groupNumber}</span>
                    )}
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
        {cost.detail && <p className="mt-3.5 text-sm leading-relaxed text-muted">{cost.detail}</p>}
        <p className="mt-3.5 text-sm leading-relaxed text-muted">
          {cost.confident
            ? "That figure came back from your insurer, not an estimate."
            : "We'll email the exact amount before your visit."}{" "}
          Cancel or reschedule any time up to 24 hours ahead and there&rsquo;s no charge; inside 24 hours it&rsquo;s
          ${PRACTICE.selfPay.followUp}.
        </p>
      </Card>

      {needsMember && intake.insuranceSource === "autofill" && intake.discovery && (
        <Card className="mt-3.5 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-sage-600"><Icon name="check" className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="font-medium text-ink">{intake.discovery.payer.name}</p>
              <p className="mt-1 text-sm text-muted">
                Member ID {maskMemberId(intake.discovery.memberId)} — already on file, nothing to type.
              </p>
            </div>
          </div>
        </Card>
      )}

      {needsMember && intake.insuranceSource !== "autofill" && (
        <Card className="mt-3.5 p-5">
          <Label htmlFor="memberId">Member ID on your {carrier?.short} card</Label>
          <TextField
            id="memberId"
            value={intake.memberId}
            onChange={(v) => patch({ memberId: v.toUpperCase() })}
            placeholder="ABC123456789"
            aria-invalid={bad("memberId")}
            className={errCls(!memberOk)}
          />
          <button
            onClick={() => setDeferMember(true)}
            className="mt-3 inline-flex min-h-[2.75rem] items-center text-sm text-slate-600 underline decoration-current underline-offset-2"
          >
            I don&rsquo;t have my card here — I&rsquo;ll add it later
          </button>
        </Card>
      )}
      {!isSelfPay && deferMember && (
        <Card className="mt-3.5 p-5">
          <p className="text-[0.95rem] leading-relaxed text-muted">
            No problem — we&rsquo;ll ask for your {carrier?.short} member ID in the email after you book. Your
            appointment is not affected.
          </p>
        </Card>
      )}

      <Card className="mt-3.5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[1.05rem] font-medium text-ink">Card on file</h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <Icon name="shield" className="h-4 w-4 text-slate-500" />
            Encrypted
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card number</Label>
            <input
              id="cardNumber"
              aria-invalid={bad("cardNumber")}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 16);
                setCard({ ...card, number: d.replace(/(.{4})/g, "$1 ").trim() });
              }}
              className={`${inputClass} ${errCls(!cardOk)}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="exp">Expires</Label>
              <input
                id="exp"
              aria-invalid={bad("exp")}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                }}
                className={`${inputClass} ${errCls(!expOk)}`}
              />
            </div>
            <div>
              <Label htmlFor="cvc">Code</Label>
              <input
                id="cvc"
              aria-invalid={bad("cvc")}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                className={`${inputClass} ${errCls(!cvcOk)}`}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="billZip">ZIP</Label>
              <input
                id="billZip"
              aria-invalid={bad("billZip")}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="78704"
                value={card.zip}
                onChange={(e) => setCard({ ...card, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                className={`${inputClass} ${errCls(!zipOk)}`}
              />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Type these, or call {PRACTICE.phone} and give them to a person. We never ask you to read a card number
          out loud into the page.
        </p>
      </Card>

      <div className="mt-7 border-t border-line pt-7">
        <Button size="lg" disabled={busy} className="w-full sm:w-auto" onClick={submit}>
          {busy ? "Booking…" : "Book my visit"}
          {!busy && <Icon name="check" className="h-5 w-5" />}
        </Button>
        {touched && !ready && (
          <p ref={errRef} role="alert" tabIndex={-1} className="mt-3 text-sm text-alert-500 outline-none">
            Still needed: {missing.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
