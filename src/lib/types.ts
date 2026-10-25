export type Mode = "form" | "chat";

export type Step =
  | "landing"
  | "fit"
  | "care"
  | "match"
  | "account"
  | "payment"
  | "done"
  | "elsewhere";

/** The six carriers the practice contracts with, plus an escape hatch. */
export type Carrier = "bcbs" | "uhc" | "aetna" | "cigna" | "oscar" | "other";

/** Only asked when carrier === "other". This is where the exclusions surface. */
export type OtherPayer = "medicare" | "medicaid" | "tricare" | "commercial" | "selfpay";

export type Need = "have-dx" | "need-dx" | "unsure";

export type Blocker = "state" | "minor" | "medicare" | "medicaid" | null;

export interface Account {
  legalFirst: string;
  legalLast: string;
  dob: string;
  pronouns: string;
  email: string;
  phone: string;
  consentTelehealth: boolean;
  consentPrivacy: boolean;
  consentTexts: boolean;
}

export interface Intake {
  mode: Mode;
  state: string;           // two-letter code, "" = unanswered
  adult: boolean | null;
  /** Set when the chat gave up asking; the DOB on the account screen is the real gate. */
  ageDeferred: boolean;
  carrier: Carrier | null;
  otherPayer: OtherPayer | null;
  selfPay: boolean;        // true when they choose to continue cash-pay
  conditions: string[];    // condition ids
  symptoms: string;
  need: Need | null;
  providerId: string | null;
  slotId: string | null;
  /** Resolved appointment time, fixed when the slot is reserved. */
  slotISO: string | null;
  account: Account;
  phoneVerified: boolean;
  memberId: string;
  /** Set when self-harm language is detected, so later screens can respond. */
  crisisDisclosed: boolean;
}

export const emptyAccount: Account = {
  legalFirst: "",
  legalLast: "",
  dob: "",
  pronouns: "",
  email: "",
  phone: "",
  consentTelehealth: false,
  consentPrivacy: false,
  consentTexts: false,
};

export const emptyIntake: Intake = {
  mode: "form",
  state: "",
  adult: null,
  ageDeferred: false,
  carrier: null,
  otherPayer: null,
  selfPay: false,
  conditions: [],
  symptoms: "",
  need: null,
  providerId: null,
  slotId: null,
  slotISO: null,
  account: emptyAccount,
  phoneVerified: false,
  memberId: "",
  crisisDisclosed: false,
};

/**
 * A blocker is a reason we are not the right practice. It never ends the
 * session — it routes to the resources page, which always offers a next step.
 */
export function blockerFor(i: Intake): Blocker {
  if (i.state && i.state !== "TX") return "state";
  if (i.adult === false) return "minor";
  if (i.carrier === "other" && i.otherPayer === "medicare") return "medicare";
  if (i.carrier === "other" && i.otherPayer === "medicaid") return "medicaid";
  return null;
}

/** Medicare/Medicaid patients in Texas can still be seen if they self-pay. */
export function blockerIsPayerOnly(b: Blocker): boolean {
  return b === "medicare" || b === "medicaid";
}
