/**
 * Mock Verified Inc. client — 1-Click Verify + 1-Click Health.
 *
 * Nothing here calls the network. Every function returns the documented shape
 * with the documented latency, so swapping in the real SDK is a change in this
 * file only. See https://docs.verified.inc/
 *
 * Test users are keyed on last name + birth date, the way Verified's own test
 * users are, so a demo can reach each branch deliberately:
 *
 *   Lovelace  1990-05-05   BCBS, active, in-network, copay met
 *   Okonkwo   1988-11-12   UHC, active, deductible not met
 *   Reyes     1979-02-28   Aetna, active, out-of-network
 *   Bell      1995-07-19   Cigna + Oscar — two plans, user picks
 *   Nakamura  1966-03-03   Medicare Advantage  -> isMedicare true
 *   Diallo    1992-09-30   Medicaid STAR       -> payer name match
 *   Fontaine  1984-01-21   inactive coverage
 *   (anything else)        not found — the ~20% manual path
 */

import type {
  DiscoveryOutcome,
  HealthDiscovery,
  HealthEligibility,
  VerifyChannel,
  VerifyResult,
  VPayer,
} from "./types";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* 1-Click Verify                                                      */
/* ------------------------------------------------------------------ */

/**
 * The documented waterfall. Autofill returns a carrier-sourced number with no
 * user input; silent verifies a number the user typed without an SMS; SMS is
 * the fallback. Which channel a given device gets is Verified's decision, so
 * the mock picks one and the UI has to handle all three.
 *
 * `force` exists so a demo can show any channel on purpose.
 */
export async function verifyAutofill(force?: VerifyChannel): Promise<VerifyResult | null> {
  await sleep(900);
  const channel = force ?? pickChannel();
  if (channel !== "autofill") return null;
  return { phone: "+15125550134", channel: "autofill", verified: true };
}

export async function verifySilent(phone: string, force?: VerifyChannel): Promise<VerifyResult | null> {
  await sleep(1200);
  const channel = force ?? pickChannel();
  if (channel === "sms") return null;
  return { phone: toE164(phone), channel: "silent", verified: true };
}

/** Falls back to a code. The real product sends it; we hand it back for the demo. */
export async function verifySendSms(phone: string): Promise<{ sent: true; demoCode: string }> {
  await sleep(700);
  return { sent: true, demoCode: String(Math.floor(100000 + Math.random() * 900000)) };
}

export async function verifyCheckSms(phone: string, code: string, expected: string): Promise<VerifyResult | null> {
  await sleep(500);
  if (code !== expected) return null;
  return { phone: toE164(phone), channel: "sms", verified: true };
}

function pickChannel(): VerifyChannel {
  /* Weighted the way the docs describe the waterfall: autofill is common,
     SMS is the last resort. */
  const r = Math.random();
  if (r < 0.45) return "autofill";
  if (r < 0.8) return "silent";
  return "sms";
}

export function toE164(input: string): string {
  const d = input.replace(/\D/g, "").slice(-10);
  return `+1${d}`;
}

/* ------------------------------------------------------------------ */
/* 1-Click Health — discovery                                          */
/* ------------------------------------------------------------------ */

const payers: Record<string, VPayer> = {
  bcbs: { name: "Blue Cross Blue Shield of Texas", verifiedId: "V100417", ids: ["BCBSTX", "84980"] },
  uhc: { name: "UnitedHealthcare", verifiedId: "V100052", ids: ["UHC", "87726"] },
  aetna: { name: "Aetna", verifiedId: "V100091", ids: ["AETNA", "60054"] },
  cigna: { name: "Cigna Healthcare", verifiedId: "V100133", ids: ["CIGNA", "62308"] },
  oscar: { name: "Oscar Health", verifiedId: "V100288", ids: ["OSCAR", "OSCAR01"] },
  medicareAdv: { name: "Humana Medicare Advantage", verifiedId: "V100610", ids: ["HUMANA", "61101"] },
  medicaid: { name: "Texas Medicaid STAR", verifiedId: "V100744", ids: ["TXMCD", "MCDTX"] },
};

const base = {
  verificationMethod: "clearinghouse" as const,
  coverageTypes: ["medical" as const],
  /* X12 service type codes: 30 = health benefit plan coverage,
     A4 = psychiatric, MH = mental health. */
  serviceTypeCodes: ["30", "A4", "MH"],
  isMedicare: false,
};

const TEST_USERS: Record<string, HealthDiscovery[]> = {
  "lovelace|1990-05-05": [{ ...base, memberId: "ZGP884102377", payer: payers.bcbs }],
  "okonkwo|1988-11-12": [{ ...base, memberId: "984412006", payer: payers.uhc }],
  "reyes|1979-02-28": [{ ...base, memberId: "W219884410", payer: payers.aetna }],
  "bell|1995-07-19": [
    { ...base, memberId: "U81194452", payer: payers.cigna },
    { ...base, memberId: "OSC4410928", payer: payers.oscar },
  ],
  "nakamura|1966-03-03": [{ ...base, memberId: "H88120045A", payer: payers.medicareAdv, isMedicare: true }],
  "diallo|1992-09-30": [{ ...base, memberId: "4410029911", payer: payers.medicaid }],
  "fontaine|1984-01-21": [{ ...base, memberId: "OSC2210477", payer: payers.oscar }],
};

export function discoveryKey(lastName: string, birthDate: string): string {
  return `${lastName.trim().toLowerCase()}|${birthDate.trim()}`;
}

/**
 * Discovery takes first name, last name and birth date. Address and SSN are
 * documented as optional inputs that raise the match rate; we deliberately
 * don't send them — a psychiatry intake shouldn't ask for an SSN, and the
 * address field was removed from this flow.
 */
export async function healthDiscover(input: {
  firstName: string;
  lastName: string;
  birthDate: string;
  state?: string;
}): Promise<DiscoveryOutcome> {
  await sleep(1800);
  if (!input.firstName.trim() || !input.lastName.trim() || !input.birthDate) {
    return { status: "error", message: "First name, last name and date of birth are required." };
  }
  const hit = TEST_USERS[discoveryKey(input.lastName, input.birthDate)];
  if (!hit) return { status: "not_found" };
  return { status: "found", results: hit };
}

/* ------------------------------------------------------------------ */
/* 1-Click Health — real-time eligibility                              */
/* ------------------------------------------------------------------ */

/** Keyed by member id so each test user gets a distinct, plausible benefit set. */
const ELIGIBILITY: Record<string, Omit<HealthEligibility, "eligibility"> & {
  eligibility: Omit<HealthEligibility["eligibility"], "member">;
}> = {
  ZGP884102377: {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.bcbs.name },
      plan: {
        name: "Blue Advantage HMO Silver",
        groupNumber: "0084119",
        groupName: "Austin Independent Employers Trust",
        effectiveDate: "2026-01-01",
        terminationDate: "2026-12-31",
      },
      benefits: [
        { type: "copay", amount: 30, label: "Specialist / behavioral health visit" },
        { type: "deductible", amount: 1500, remaining: 0, label: "Individual deductible" },
        { type: "outOfPocket", amount: 6000, remaining: 4150, label: "Out-of-pocket maximum" },
      ],
      contacts: [{ phone: "+18005218328" }],
    },
    network: { status: "IN_NETWORK" },
  },
  "984412006": {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.uhc.name },
      plan: { name: "Choice Plus PPO", groupNumber: "712049", effectiveDate: "2026-01-01" },
      benefits: [
        { type: "coinsurance", amount: 20, label: "After deductible" },
        { type: "deductible", amount: 2500, remaining: 2500, label: "Individual deductible — not yet met" },
        { type: "outOfPocket", amount: 7500, remaining: 7500, label: "Out-of-pocket maximum" },
      ],
    },
    network: { status: "IN_NETWORK" },
  },
  W219884410: {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.aetna.name },
      plan: { name: "Aetna Select Open Access", groupNumber: "0290114", effectiveDate: "2026-02-01" },
      benefits: [
        { type: "copay", amount: 45, label: "Specialist visit" },
        { type: "deductible", amount: 1000, remaining: 320, label: "Individual deductible" },
      ],
    },
    network: { status: "OUT_OF_NETWORK" },
  },
  U81194452: {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.cigna.name },
      plan: { name: "Cigna Connect 2000", groupNumber: "3341980", effectiveDate: "2026-01-01" },
      benefits: [
        { type: "copay", amount: 25, label: "Behavioral health visit" },
        { type: "deductible", amount: 2000, remaining: 0, label: "Individual deductible" },
      ],
    },
    network: { status: "IN_NETWORK" },
  },
  OSC4410928: {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.oscar.name },
      plan: { name: "Oscar Classic Silver", groupNumber: "OS22110", effectiveDate: "2026-01-01" },
      benefits: [{ type: "copay", amount: 35, label: "Mental health specialist" }],
    },
    network: { status: "IN_NETWORK" },
  },
  OSC2210477: {
    eligibility: {
      coverageStatus: "inactive",
      coverageType: ["medical"],
      payer: { name: payers.oscar.name },
      plan: {
        name: "Oscar Classic Bronze",
        groupNumber: "OS11904",
        effectiveDate: "2025-01-01",
        terminationDate: "2025-12-31",
      },
      benefits: [],
    },
    network: { status: "INDETERMINATE" },
  },
  H88120045A: {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.medicareAdv.name },
      plan: { name: "Humana Gold Plus HMO", groupNumber: "H1036", effectiveDate: "2026-01-01" },
      benefits: [{ type: "copay", amount: 25, label: "Specialist visit" }],
    },
    network: { status: "OUT_OF_NETWORK" },
  },
  "4410029911": {
    eligibility: {
      coverageStatus: "active",
      coverageType: ["medical"],
      payer: { name: payers.medicaid.name },
      plan: { name: "STAR Managed Care", effectiveDate: "2026-01-01" },
      benefits: [{ type: "copay", amount: 0, label: "No patient cost share" }],
    },
    network: { status: "OUT_OF_NETWORK" },
  },
};

/**
 * Real-time eligibility. In production this is submitted against the practice
 * NPI, which is why it can't run before a provider relationship exists.
 */
export async function healthEligibility(
  discovery: HealthDiscovery,
  member: { firstName: string; lastName: string; birthDate: string },
): Promise<HealthEligibility | null> {
  await sleep(2200);
  const row = ELIGIBILITY[discovery.memberId];
  if (!row) return null;
  return {
    ...row,
    eligibility: {
      ...row.eligibility,
      member: {
        memberId: discovery.memberId,
        fullName: { firstName: member.firstName, lastName: member.lastName },
        birthDate: member.birthDate,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers the UI needs                                                */
/* ------------------------------------------------------------------ */

/** Verified documents `isMedicare`; there is no `isMedicaid`, so match the name. */
export function looksLikeMedicaid(payerName: string): boolean {
  return /\b(medicaid|chip|star\s*(kids|plus)?)\b/i.test(payerName);
}

/** Member IDs are shown part-masked, as Verified's own UI does. */
export function maskMemberId(id: string): string {
  if (id.length <= 4) return id;
  return `${id.slice(0, 2)}${"•".repeat(Math.max(3, id.length - 6))}${id.slice(-4)}`;
}

/** The number a patient actually wants: what this visit will cost them. */
export function patientCost(e: HealthEligibility | null): {
  text: string;
  detail: string | null;
  confident: boolean;
} {
  if (!e) return { text: "$25–$45", detail: "Estimated — we'll confirm before your visit.", confident: false };
  if (e.eligibility.coverageStatus !== "active") {
    return {
      text: "Coverage not active",
      detail: "Your plan came back inactive. We'll check with your insurer, or you can pay directly.",
      confident: true,
    };
  }
  if (e.network.status === "OUT_OF_NETWORK") {
    return {
      text: "Out of network",
      detail: "This plan is out of network with us. Paying directly is usually cheaper — we'll show you both.",
      confident: true,
    };
  }
  const copay = e.eligibility.benefits.find((b) => b.type === "copay");
  const deductible = e.eligibility.benefits.find((b) => b.type === "deductible");
  if (deductible && (deductible.remaining ?? 0) > 0) {
    return {
      text: `Up to $${deductible.remaining}`,
      detail: `Your deductible isn't met yet ($${deductible.remaining} of $${deductible.amount} remaining), so the visit applies to it.`,
      confident: true,
    };
  }
  if (copay) {
    return { text: `$${copay.amount}`, detail: copay.label ?? null, confident: true };
  }
  const coins = e.eligibility.benefits.find((b) => b.type === "coinsurance");
  if (coins) return { text: `${coins.amount}% of the visit`, detail: coins.label ?? null, confident: true };
  return { text: "To be confirmed", detail: "Your plan is active; we'll confirm the amount before your visit.", confident: false };
}
