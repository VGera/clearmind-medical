"use client";

import React, { useState } from "react";
import { CRISIS_RESOURCE, NATIONAL_RESOURCES, OTHER_STATE, PRACTICE, localise, stateName, type Resource } from "@/lib/data";
import { blockerIsPayerOnly, type Blocker, type Intake } from "@/lib/types";
import { Button, Card, Icon, inputClass } from "./ui";

function copyFor(blocker: Blocker, intake: Intake) {
  const where = intake.state ? stateName(intake.state) : "your state";
  switch (blocker) {
    case "state":
      return {
        title: `We're not in ${where} yet.`,
        body: `We're working on being available nationally, so please check back. In the meantime, these are good places to get help right now.`,
        extra: null,
      };
    case "minor":
      return {
        title: "We see adults 18 and over.",
        body: "Care for someone younger needs a clinician trained for it. These directories let you filter for child and teen psychiatrists — and a pediatrician can usually refer you faster.",
        extra: "If there's any thought of self-harm, call or text 988 now. They talk with young people every day.",
      };
    case "medicare":
      return {
        title: "We can't bill Medicare — but you do have options.",
        body: "Call the behavioral health number on the back of your card and ask for in-network psychiatry with telehealth. Or start with the directories below.",
        extra: null,
      };
    case "medicaid":
      return {
        title: "We can't bill Medicaid — but you do have options.",
        body: "Your plan's member services line can name psychiatrists who take it. Community mental health centers do too, on a sliding scale.",
        extra: null,
      };
    default:
      return {
        title: "Mental health help, wherever you are.",
        body: "Free or low-cost, nationwide, open to anyone — patient or not.",
        extra: null,
      };
  }
}

function ResourceCard({ r }: { r: Resource }) {
  const isTel = r.href.startsWith("tel:");
  return (
    <Card className="p-5">
      <h3 className="font-serif text-[1.0625rem] text-ink">{r.name}</h3>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{r.what}</p>
      <a
        href={r.href}
        target={isTel ? undefined : "_blank"}
        rel={isTel ? undefined : "noreferrer"}
        className="mt-3.5 inline-flex min-h-[2.75rem] items-center gap-2 text-[0.95rem] font-medium text-slate-600 hover:underline"
      >
        <Icon name={isTel ? "phone" : "link"} className="h-4 w-4" />
        {r.action}
      </a>
    </Card>
  );
}

export function CareElsewhere({
  blocker,
  intake,
  onSelfPay,
  onBack,
}: {
  blocker: Blocker;
  intake: Intake;
  onSelfPay: () => void;
  onBack: () => void;
}) {
  const c = copyFor(blocker, intake);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const payerOnly = blockerIsPayerOnly(blocker);

  return (
    <div className="rise">
      <button onClick={onBack} className="mb-5 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="back" className="h-4 w-4" />
        Change my answer
      </button>

      <h1 tabIndex={-1} className="max-w-md font-serif text-[1.55rem] leading-tight text-ink outline-none sm:text-[1.9rem]">
        {c.title}
      </h1>
      <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-muted">{c.body}</p>

      {payerOnly && intake.state === "TX" && (
        <Card className="mt-6 border-sage-500/30 bg-sage-100/50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-sage-600"><Icon name="heart" className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="font-medium text-ink">You can still see us</h2>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                You&rsquo;re in Texas, so our doctors can treat you — we just can&rsquo;t bill your plan.
                Paying directly is <strong className="font-medium text-ink">${PRACTICE.selfPay.intake}</strong> for the
                first visit, <strong className="font-medium text-ink">${PRACTICE.selfPay.followUp}</strong> after.
              </p>
              <Button className="mt-4 w-full sm:w-auto" onClick={onSelfPay}>
                Continue, paying directly
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
              <p className="mt-2.5 text-xs text-muted">A covered option below may cost less. Look at both.</p>
            </div>
          </div>
        </Card>
      )}

      <h2 className="mb-3.5 mt-9 font-serif text-[1.2rem] text-ink">Where to go next</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {NATIONAL_RESOURCES.map((r) => (
          /* Aimed at their state where we know it. */
          <ResourceCard key={r.name} r={localise(r, intake.state || null)} />
        ))}
      </div>

      {/* 988 kept present and reachable, but not presented as the answer to
          "I'd like to see a psychiatrist". It's also in the header strip on
          every screen. */}
      <Card className="mt-3 border-slate-200 bg-slate-50 p-5">
        <h3 className="font-serif text-[1.0625rem] text-ink">If things feel unsafe right now</h3>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
          {CRISIS_RESOURCE.what}{" "}
          <a
            href={CRISIS_RESOURCE.href}
            className="font-medium text-slate-600 underline decoration-current underline-offset-2"
          >
            {CRISIS_RESOURCE.action}
          </a>
          . {CRISIS_RESOURCE.detail}
        </p>
      </Card>

      {blocker === "minor" && (
        <Card className="mt-3 p-5">
          <h3 className="font-serif text-[1.0625rem] text-ink">Start with a pediatrician</h3>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
            They can refer straight to child and teen psychiatry, which usually moves faster than calling practices
            one by one.
          </p>
        </Card>
      )}

      {c.extra && <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted">{c.extra}</p>}

      {blocker === "state" && (
        <Card className="mt-6 p-5">
          <h3 className="font-serif text-[1.0625rem] text-ink">
            Want us to tell you when we open in {stateName(intake.state || OTHER_STATE)}?
          </h3>
          {sent ? (
            <p className="mt-3 inline-flex items-center gap-2 text-[0.95rem] font-medium text-sage-600">
              <Icon name="check" className="h-4 w-4" /> Thanks — we&rsquo;ll be in touch.
            </p>
          ) : (
            <form
              className="mt-3.5 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setSent(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className={`${inputClass} flex-1`}
              />
              <Button type="submit" variant="secondary" className="w-full sm:w-auto">Notify me</Button>
            </form>
          )}
        </Card>
      )}

      <p className="mt-9 text-sm leading-relaxed text-muted">
        Your answers stay on this device and are gone when you close the tab. Nothing is sent to us
        unless you book.
      </p>
    </div>
  );
}
