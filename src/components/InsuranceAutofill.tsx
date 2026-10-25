"use client";

import React, { useRef, useState } from "react";
import type { Carrier, Intake } from "@/lib/types";
import {
  healthDiscover,
  healthEligibility,
  looksLikeMedicaid,
  maskMemberId,
} from "@/lib/verified/mock";
import type { DiscoveryOutcome, HealthDiscovery, VPayer } from "@/lib/verified/types";
import { Button, Card, Icon, Label, TextField, inputClass } from "./ui";

/** Map a discovered payer onto the six options this practice contracts with. */
function toCarrier(payer: VPayer): Carrier {
  const n = `${payer.name} ${payer.ids.join(" ")}`.toLowerCase();
  if (/blue cross|bcbs/.test(n)) return "bcbs";
  if (/unitedhealth|uhc/.test(n)) return "uhc";
  if (/aetna/.test(n)) return "aetna";
  if (/cigna/.test(n)) return "cigna";
  if (/oscar/.test(n)) return "oscar";
  return "other";
}

/**
 * 1-Click Health insurance discovery.
 *
 * Three fields in, the plan and member ID out — and because the same three
 * fields are needed for the chart anyway, they prefill the details screen
 * rather than being asked twice.
 *
 * Manual entry is never hidden behind a failure: roughly one in five adults
 * won't be found, so "Enter it myself" is on screen the whole time.
 */
export function InsuranceAutofill({
  intake,
  patch,
  onManual,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onManual: () => void;
}) {
  const a = intake.account;
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"form" | "choose" | "confirmed">("form");
  const [outcome, setOutcome] = useState<DiscoveryOutcome | null>(null);
  const [picked, setPicked] = useState<HealthDiscovery | null>(null);
  const [checking, setChecking] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const set = (p: Partial<Intake["account"]>) => patch({ account: { ...a, ...p } });
  const ready = a.legalFirst.trim() && a.legalLast.trim() && a.dob;

  const apply = async (hit: HealthDiscovery) => {
    setPicked(hit);
    setPhase("confirmed");
    const carrier = toCarrier(hit.payer);
    const medicaid = looksLikeMedicaid(hit.payer.name);

    patch({
      carrier,
      otherPayer: hit.isMedicare ? "medicare" : medicaid ? "medicaid" : carrier === "other" ? "commercial" : null,
      selfPay: false,
      memberId: hit.memberId,
      discovery: hit,
      insuranceSource: "autofill",
    });

    /* Medicare and Medicaid are excluded, so there's no point spending an
       eligibility check on them — the fit check routes to resources instead. */
    if (hit.isMedicare || medicaid) return;

    setChecking(true);
    const elig = await healthEligibility(hit, {
      firstName: a.legalFirst,
      lastName: a.legalLast,
      birthDate: a.dob,
    });
    patch({ eligibility: elig });
    setChecking(false);
  };

  const search = async () => {
    setBusy(true);
    setOutcome(null);
    const res = await healthDiscover({
      firstName: a.legalFirst,
      lastName: a.legalLast,
      birthDate: a.dob,
      state: intake.state,
    });
    setBusy(false);
    setOutcome(res);
    requestAnimationFrame(() => statusRef.current?.focus());
    if (res.status === "found") {
      if (res.results.length === 1) await apply(res.results[0]);
      else setPhase("choose");
    }
  };

  /* ---------------- confirmed ---------------- */

  if (phase === "confirmed" && picked) {
    return (
      <Card className="border-sage-500/30 bg-sage-100/40 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-sage-600"><Icon name="check" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{picked.payer.name}</p>
            <p className="mt-1 text-sm text-muted">
              Member ID {maskMemberId(picked.memberId)}
              {picked.verificationMethod === "clearinghouse" && " · confirmed with your insurer"}
            </p>
            {checking && (
              <p className="mt-2.5 inline-flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
                <span className="dot-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="dot-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="dot-3 h-1.5 w-1.5 rounded-full bg-slate-400" />
                Checking what your plan covers…
              </p>
            )}
            {!checking && intake.eligibility && (
              <p className="mt-2 text-sm text-sage-600">
                {intake.eligibility.eligibility.plan.name} · coverage{" "}
                {intake.eligibility.eligibility.coverageStatus}
              </p>
            )}
            <button
              onClick={() => {
                setPhase("form");
                setPicked(null);
                setOutcome(null);
                patch({ carrier: null, otherPayer: null, memberId: "", discovery: null, eligibility: null, insuranceSource: null });
              }}
              className="mt-3 inline-flex min-h-[2.75rem] items-center text-sm text-slate-600 underline decoration-current underline-offset-2"
            >
              That&rsquo;s not my plan
            </button>
          </div>
        </div>
      </Card>
    );
  }

  /* ---------------- more than one plan ---------------- */

  if (phase === "choose" && outcome?.status === "found") {
    return (
      <div className="space-y-2.5">
        <p className="text-sm text-muted">We found more than one. Which one would you like to use?</p>
        {outcome.results.map((r) => (
          <button
            key={r.memberId}
            onClick={() => apply(r)}
            className="flex w-full min-h-[3.5rem] items-center justify-between gap-3 rounded-xl2 border border-line bg-panel px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block font-medium text-ink">{r.payer.name}</span>
              <span className="block text-sm text-muted">Member ID {maskMemberId(r.memberId)}</span>
            </span>
            <Icon name="arrow" className="h-5 w-5 shrink-0 text-slate-500" />
          </button>
        ))}
        <button
          onClick={onManual}
          className="inline-flex min-h-[2.75rem] items-center text-sm text-slate-600 underline decoration-current underline-offset-2"
        >
          Neither — I&rsquo;ll enter it myself
        </button>
      </div>
    );
  }

  /* ---------------- the form ---------------- */

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="af-first">First name</Label>
          <TextField id="af-first" value={a.legalFirst} onChange={(v) => set({ legalFirst: v })} autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="af-last">Last name</Label>
          <TextField id="af-last" value={a.legalLast} onChange={(v) => set({ legalLast: v })} autoComplete="family-name" />
        </div>
        <div>
          <Label htmlFor="af-dob">Date of birth</Label>
          <input
            id="af-dob"
            type="date"
            value={a.dob}
            min="1900-01-01"
            onChange={(e) => set({ dob: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-muted">
        We use these to look up your plan, and they go on your chart — so you won&rsquo;t be asked again. We never
        ask for your Social Security number.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" disabled={!ready || busy} onClick={search} className="w-full sm:w-auto">
          {busy ? "Looking…" : "Find my insurance"}
          {!busy && <Icon name="arrow" className="h-5 w-5" />}
        </Button>
        <Button size="lg" variant="secondary" onClick={onManual} className="w-full sm:w-auto">
          Enter it myself
        </Button>
      </div>

      <p ref={statusRef} tabIndex={-1} aria-live="polite" className="mt-3 text-sm outline-none">
        {busy && <span className="text-slate-600">Checking with your insurer…</span>}
        {!busy && outcome?.status === "not_found" && (
          <span className="text-clay-600">
            We couldn&rsquo;t find a plan under that name and birthday — that happens for about one in five people.
            Entering it yourself works just as well.
          </span>
        )}
        {!busy && outcome?.status === "error" && <span className="text-clay-600">{outcome.message}</span>}
      </p>
    </div>
  );
}
