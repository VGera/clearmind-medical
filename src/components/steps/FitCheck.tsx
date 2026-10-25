"use client";

import React, { useState } from "react";
import { CARRIERS, OTHER_PAYERS, OTHER_STATE, PRACTICE, QUESTIONS, US_STATES, stateName } from "@/lib/data";
import type { Carrier, Intake, OtherPayer } from "@/lib/types";
import { InsuranceAutofill } from "../InsuranceAutofill";
import { Button, Card, Chip, Icon, OptionCard, StepHeading, inputClass } from "../ui";

function Question({
  id,
  text,
  note,
  children,
}: {
  id: string;
  text: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rise border-t border-line pt-8 first:border-0 first:pt-0" aria-labelledby={id}>
      <div className="mb-4">
        <h2 id={id} className="font-serif text-[1.25rem] leading-snug text-ink">{text}</h2>
      </div>
      {note && <p className="-mt-2 mb-4 text-sm text-muted">{note}</p>}
      {children}
    </section>
  );
}

function Blocked({ title, body, onGo }: { title: string; body: string; onGo: () => void }) {
  return (
    <Card className="rise mt-5 border-slate-200 bg-slate-50 p-5" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-slate-500"><Icon name="heart" className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h3 className="font-medium text-ink">{title}</h3>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{body}</p>
          <Button className="mt-4 w-full sm:w-auto" onClick={onGo}>
            Where to go instead
            <Icon name="arrow" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function FitCheck({
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
  const stateBlocked = Boolean(intake.state) && intake.state !== "TX";
  const minorBlocked = intake.adult === false;
  const payerBlocked = intake.carrier === "other" && (intake.otherPayer === "medicare" || intake.otherPayer === "medicaid");

  const showAdult = intake.state === "TX";
  const showCarrier = showAdult && intake.adult === true;
  const showOther = showCarrier && intake.carrier === "other" && intake.insuranceSource === "manual";
  /* Autofill first; the list is always one tap away and never hidden. */
  const [manual, setManual] = useState(false);

  /* Read the question that just appeared, not just the first one on the screen —
     otherwise a patient who can't read hears question one and then silence. */

  const ready =
    intake.state === "TX" &&
    intake.adult === true &&
    intake.carrier !== null &&
    (intake.carrier !== "other" || (intake.otherPayer !== null && !payerBlocked));

  return (
    <div>
      <StepHeading
        eyebrow="Fit check"
        title="A few quick questions"
        sub="Just to be sure we're the right place for you."
      />

      <div className="space-y-8">
        <Question id="q-state" text={QUESTIONS.state}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              aria-pressed={intake.state === "TX"}
              onClick={() => patch({ state: "TX" })}
              className={`inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full border px-7 text-[1.0625rem] font-medium transition ${
                intake.state === "TX"
                  ? "border-slate-500 bg-slate-500 text-white"
                  : "border-slate-200 bg-panel text-slate-600 hover:bg-slate-50"
              }`}
            >
              {intake.state === "TX" && <Icon name="check" className="h-5 w-5" />}
              Texas
            </button>
            <div className="sm:w-56">
              <label htmlFor="state" className="sr-only">Pick a different state</label>
              <select
                id="state"
                value={intake.state === "TX" ? "" : intake.state}
                onChange={(e) => patch({ state: e.target.value, adult: null, carrier: null, otherPayer: null })}
                className={inputClass}
              >
                <option value="">Another state…</option>
                {US_STATES.filter((s) => s.code !== "TX").map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
                <option value={OTHER_STATE}>Somewhere else</option>
              </select>
            </div>
          </div>
          {stateBlocked && (
            <Blocked
              title={`We're not in ${stateName(intake.state)} yet`}
              body="We're working on being available nationally, so do check back. In the meantime, here are places that can help you right now."
              onGo={onElsewhere}
            />
          )}
        </Question>

        {showAdult && (
          <Question id="q-adult" text={QUESTIONS.adult}>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby="q-adult">
              {[
                { v: true, label: "Yes" },
                { v: false, label: "No, under 18" },
              ].map((o) => (
                <Chip key={String(o.v)} single selected={intake.adult === o.v} onClick={() => patch({ adult: o.v, carrier: null, otherPayer: null })}>
                  {o.label}
                </Chip>
              ))}
            </div>
            {minorBlocked && (
              <Blocked
                title="We see adults 18 and over"
                body="Care for someone younger needs a clinician trained for it. Here's how to find one."
                onGo={onElsewhere}
              />
            )}
          </Question>
        )}

        {showCarrier && (
          <Question
            id="q-carrier"
            text={QUESTIONS.carrier}
            note={
              manual
                ? "Just the name. No card yet."
                : "We can look it up for you, so you don't have to find your card."
            }
          >
            {manual ? (
              <>
                <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="q-carrier">
                  {CARRIERS.map((c) => (
                    <OptionCard
                      key={c.id}
                      selected={intake.carrier === c.id}
                      title={c.label}
                      onClick={() =>
                        patch({
                          carrier: c.id as Carrier,
                          otherPayer: null,
                          selfPay: false,
                          insuranceSource: "manual",
                          discovery: null,
                          eligibility: null,
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={() => setManual(false)}
                  className="mt-3.5 inline-flex min-h-[2.75rem] items-center gap-2 text-sm text-slate-600 underline decoration-current underline-offset-2"
                >
                  <Icon name="spark" className="h-4 w-4" />
                  Look it up for me instead
                </button>
              </>
            ) : (
              <InsuranceAutofill intake={intake} patch={patch} onManual={() => setManual(true)} />
            )}

            {/* Discovery can surface an excluded payer, so the explanation has
                to live here too — not only on the manual path. */}
            {payerBlocked && intake.insuranceSource === "autofill" && (
              <Blocked
                title={`We can't bill ${intake.otherPayer === "medicare" ? "Medicare" : "Medicaid"}`}
                body={`We found your ${intake.discovery?.payer.name ?? "plan"}, and we're not enrolled with that program — claims wouldn't go through. There are good covered options, and you can still see us by paying directly.`}
                onGo={onElsewhere}
              />
            )}
          </Question>
        )}

        {showOther && (
          <Question id="q-other" text={QUESTIONS.otherPayer}>
            <div className="space-y-2.5" role="radiogroup" aria-labelledby="q-other">
              {OTHER_PAYERS.map((p) => (
                <OptionCard
                  key={p.id}
                  selected={intake.otherPayer === p.id}
                  title={p.label}
                  note={p.note}
                  onClick={() => patch({ otherPayer: p.id as OtherPayer, selfPay: p.id === "selfpay" })}
                />
              ))}
            </div>
            {payerBlocked && (
              <Blocked
                title={`We can't bill ${intake.otherPayer === "medicare" ? "Medicare" : "Medicaid"}`}
                body="There are good covered options — and if you'd rather, you can still see us by paying directly."
                onGo={onElsewhere}
              />
            )}
          </Question>
        )}
      </div>

      {ready && (
        <div className="rise mt-9 border-t border-line pt-7">
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto">
            Next: what&rsquo;s going on
            <Icon name="arrow" className="h-5 w-5" />
          </Button>
          {intake.selfPay && (
            <p className="mt-3 text-sm text-muted">
              Paying directly: ${PRACTICE.selfPay.intake} first visit, ${PRACTICE.selfPay.followUp} after.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
