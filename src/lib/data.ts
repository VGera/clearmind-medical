import type { Carrier, Need, OtherPayer } from "./types";

/* ------------------------------------------------------------------ */
/* Practice footprint                                                  */
/* ------------------------------------------------------------------ */

export const PRACTICE = {
  name: "ClearMind Medical",
  phone: "(512) 555-0100",
  phoneHref: "tel:+15125550100",
  states: ["TX"],
  stateNames: "Texas",
  minAge: 18,
  selfPay: { intake: 249, followUp: 129 },
};

/* ------------------------------------------------------------------ */
/* Questions — the fewest words that can carry each one.               */
/* ------------------------------------------------------------------ */

export const QUESTIONS = {
  state: "What state are you in?",
  adult: "Are you 18 or older?",
  carrier: "Your insurance?",
  otherPayer: "Who's your plan through?",
  conditions: "What's going on?",
  symptoms: "Anything else we should know?",
  need: "What would help most?",
  match: "Two good matches",
  account: "A few details for your chart",
  verify: "Check your phone",
  payment: "Nothing is charged today.",
};

/* ------------------------------------------------------------------ */
/* Option sets                                                         */
/* ------------------------------------------------------------------ */

export const CARRIERS: { id: Carrier; label: string; short: string }[] = [
  { id: "bcbs", label: "Blue Cross Blue Shield", short: "BCBS" },
  { id: "uhc", label: "UnitedHealthcare", short: "UHC" },
  // The brief listed "Athena". Athenahealth is an EHR vendor, not a payer, so
  // this is Aetna. parse.ts accepts "athena" spoken, so a patient saying it matches.
  { id: "aetna", label: "Aetna", short: "Aetna" },
  { id: "cigna", label: "Cigna", short: "Cigna" },
  { id: "oscar", label: "Oscar Health", short: "Oscar" },
  { id: "other", label: "Other or not sure", short: "Other" },
];

export const OTHER_PAYERS: { id: OtherPayer; label: string; note: string }[] = [
  { id: "commercial", label: "Another plan", note: "We'll check your benefits" },
  { id: "selfpay", label: "No insurance", note: `$${PRACTICE.selfPay.intake} first visit, $${PRACTICE.selfPay.followUp} after` },
  { id: "medicare", label: "Medicare", note: "We can't bill Medicare" },
  { id: "medicaid", label: "Medicaid, CHIP, or STAR", note: "We can't bill Medicaid" },
  { id: "tricare", label: "TRICARE or VA", note: "We'll check your benefits" },
];

/** `label` is the chip. `prose` is for sentences, where a label reads oddly. */
export const CONDITIONS: { id: string; label: string; prose: string; aka: string[] }[] = [
  { id: "adhd", label: "ADHD", prose: "ADHD", aka: ["adhd", "add", "focus", "attention", "concentrate", "distract"] },
  { id: "anxiety", label: "Anxiety", prose: "anxiety", aka: ["anxiety", "anxious", "worry", "worried", "nervous", "on edge", "panic attack", "panicky"] },
  { id: "depression", label: "Depression", prose: "depression", aka: ["depression", "depressed", "low mood", "sad", "hopeless", "empty", "no motivation", "numb"] },
  { id: "bipolar", label: "Mood swings", prose: "bipolar disorder", aka: ["bipolar", "mood swing", "manic", "mania", "hypomania", "up and down"] },
  { id: "ptsd", label: "Trauma or PTSD", prose: "PTSD and trauma", aka: ["ptsd", "trauma", "flashback", "nightmare", "assault", "abuse", "combat"] },
  { id: "ocd", label: "OCD", prose: "OCD", aka: ["ocd", "obsessive", "compulsive", "intrusive", "checking", "rituals"] },
  { id: "sleep", label: "Sleep", prose: "sleep problems", aka: ["sleep", "insomnia", "can't sleep", "cant sleep", "lying awake", "exhausted"] },
  { id: "perinatal", label: "Postpartum", prose: "postpartum mood", aka: ["postpartum", "perinatal", "pregnan", "after birth", "new mom", "new mother"] },
  { id: "substance", label: "Alcohol or drugs", prose: "alcohol and substance use", aka: ["alcohol", "drinking", "drugs", "substance", "weed", "opioid", "sober"] },
  { id: "other", label: "Something else", prose: "what you described", aka: ["something else", "not sure what", "other"] },
];

export const NEEDS: { id: Need; label: string; short: string; detail: string }[] = [
  { id: "have-dx", label: "I have a diagnosis and need medication", short: "Refills or a dose change", detail: "Refills, or a dose that isn't working." },
  { id: "need-dx", label: "I'm looking for a diagnosis and medication", short: "An evaluation and a plan", detail: "A full evaluation, then medication if it fits." },
  { id: "unsure", label: "I'm not sure — I just need help", short: "I'm not sure", detail: "That's completely fine. We'll start there." },
];

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

/** The patient said they're not in Texas without naming where. */
export const OTHER_STATE = "__other";

export function stateName(code: string): string {
  if (code === OTHER_STATE) return "your state";
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export interface Provider {
  id: string;
  name: string;
  credential: string;
  role: string;
  years: number;
  focus: string[];
  accepts: Carrier[];
  languages: string[];
  bio: string;
  rating: number;
  reviews: number;
  /** Hours from now for each open slot, ascending. */
  slotHours: number[];
  tint: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "okafor",
    name: "Amara Okafor",
    credential: "MD",
    role: "Psychiatrist",
    years: 14,
    focus: ["adhd", "anxiety", "sleep", "depression"],
    accepts: ["bcbs", "uhc", "aetna", "cigna", "oscar"],
    languages: ["English"],
    bio: "Unhurried first visits. Never rushes a medication decision.",
    rating: 4.9,
    reviews: 312,
    slotHours: [26, 30, 49, 73, 77],
    tint: "#2d5468",
  },
  {
    id: "raman",
    name: "Priya Raman",
    credential: "PMHNP-BC",
    role: "Psychiatric nurse practitioner",
    years: 9,
    focus: ["adhd", "anxiety", "depression", "sleep"],
    accepts: ["bcbs", "uhc", "aetna", "cigna", "oscar"],
    languages: ["English", "Hindi", "Tamil"],
    bio: "Keeps evening hours. Quick to answer between visits.",
    rating: 4.8,
    reviews: 486,
    slotHours: [5, 8, 27, 31, 52],
    tint: "#5f8871",
  },
  {
    id: "reyes",
    name: "Daniel Reyes",
    credential: "DO",
    role: "Psychiatrist",
    years: 18,
    focus: ["bipolar", "depression", "anxiety"],
    accepts: ["bcbs", "uhc", "cigna"],
    languages: ["English", "Spanish"],
    bio: "Mood disorders and long-term stability. Works closely with therapists.",
    rating: 4.9,
    reviews: 274,
    slotHours: [80, 84, 104, 128],
    tint: "#244557",
  },
  {
    id: "fischer",
    name: "Lena Fischer",
    credential: "MD",
    role: "Psychiatrist",
    years: 11,
    focus: ["ptsd", "depression", "anxiety", "sleep"],
    accepts: ["bcbs", "aetna", "oscar"],
    languages: ["English", "German"],
    bio: "Trauma-informed. You set how much you share, and when.",
    rating: 5.0,
    reviews: 198,
    slotHours: [53, 57, 76, 100],
    tint: "#9c6241",
  },
  {
    id: "bustamante",
    name: "Sofia Bustamante",
    credential: "MD",
    role: "Psychiatrist",
    years: 16,
    focus: ["perinatal", "anxiety", "depression", "ocd"],
    accepts: ["bcbs", "aetna", "cigna"],
    languages: ["Spanish", "English"],
    bio: "Pregnancy and postpartum care. Sees patients in Spanish or English.",
    rating: 4.9,
    reviews: 221,
    slotHours: [55, 79, 103, 127],
    tint: "#4c7159",
  },
  {
    id: "hale",
    name: "Marcus Hale",
    credential: "PMHNP-BC",
    role: "Psychiatric nurse practitioner",
    years: 7,
    focus: ["substance", "anxiety", "depression", "adhd"],
    accepts: ["uhc", "cigna", "oscar"],
    languages: ["English"],
    bio: "Evenings and weekends. Non-judgmental about drinking and drug use.",
    rating: 4.7,
    reviews: 163,
    slotHours: [12, 34, 58, 82],
    tint: "#b9764f",
  },
];

/**
 * Slot times are generated from "now" so the demo never looks stale, then
 * snapped into 8am-8pm clinic hours.
 */
export function resolveSlot(now: Date, hours: number): Date {
  const d = new Date(now.getTime() + hours * 3600_000);
  d.setMinutes(Math.round(d.getMinutes() / 20) * 20, 0, 0);
  if (d.getHours() < 8) d.setHours(8, d.getMinutes() === 0 ? 20 : d.getMinutes());
  if (d.getHours() >= 20) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, d.getMinutes());
  }
  return d;
}

export function slotId(providerId: string, hours: number): string {
  return `${providerId}:${hours}`;
}

/* ------------------------------------------------------------------ */
/* Crisis + national resources                                         */
/* ------------------------------------------------------------------ */

export interface Resource {
  name: string;
  what: string;
  action: string;
  href: string;
  detail?: string;
}

export const CRISIS_RESOURCE: Resource = {
  name: "988 Suicide & Crisis Lifeline",
  what: "A trained counselor, any hour, anywhere in the US. Free and confidential.",
  action: "Call or text 988",
  href: "tel:988",
  detail: "Or chat at 988lifeline.org",
};

export const NATIONAL_RESOURCES: Resource[] = [
  CRISIS_RESOURCE,
  {
    name: "SAMHSA National Helpline",
    what: "Free referrals to treatment near you, 24/7, English and Spanish.",
    action: "Call 1-800-662-4357",
    href: "tel:18006624357",
  },
  {
    name: "FindTreatment.gov",
    what: "Government directory. Filter by what your insurance covers.",
    action: "Open findtreatment.gov",
    href: "https://findtreatment.gov",
  },
  {
    name: "Psychology Today",
    what: "Search psychiatrists by state, insurance, and who's taking new patients.",
    action: "Open the directory",
    href: "https://www.psychologytoday.com/us/psychiatrists",
  },
];
