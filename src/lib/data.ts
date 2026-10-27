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

export type Tint = "lilac" | "apricot" | "mint" | "sky" | "blush" | "sand";

/** `label` is the chip. `prose` is for sentences, where a label reads oddly. */
export const CONDITIONS: { id: string; label: string; prose: string; tint: Tint; aka: string[] }[] = [
  { tint: "apricot", id: "adhd", label: "ADHD", prose: "ADHD", aka: ["adhd", "add", "focus", "attention", "concentrate", "distract"] },
  { tint: "lilac", id: "anxiety", label: "Anxiety", prose: "anxiety", aka: ["anxiety", "anxious", "worry", "worried", "nervous", "on edge", "panic attack", "panicky"] },
  { tint: "sky", id: "depression", label: "Depression", prose: "depression", aka: ["depression", "depressed", "low mood", "sad", "hopeless", "empty", "no motivation", "numb"] },
  { tint: "mint", id: "bipolar", label: "Mood swings", prose: "bipolar disorder", aka: ["bipolar", "mood swing", "manic", "mania", "hypomania", "up and down"] },
  { tint: "blush", id: "ptsd", label: "Trauma or PTSD", prose: "PTSD and trauma", aka: ["ptsd", "trauma", "flashback", "nightmare", "assault", "abuse", "combat"] },
  { tint: "lilac", id: "ocd", label: "OCD", prose: "OCD", aka: ["ocd", "obsessive", "compulsive", "intrusive", "checking", "rituals"] },
  { tint: "sky", id: "sleep", label: "Sleep", prose: "sleep problems", aka: ["sleep", "insomnia", "can't sleep", "cant sleep", "lying awake", "exhausted"] },
  { tint: "blush", id: "perinatal", label: "Postpartum", prose: "postpartum mood", aka: ["postpartum", "perinatal", "pregnan", "after birth", "new mom", "new mother"] },
  { tint: "sand", id: "substance", label: "Alcohol or drugs", prose: "alcohol and substance use", aka: ["alcohol", "drinking", "drugs", "substance", "weed", "opioid", "sober"] },
  { tint: "mint", id: "other", label: "Something else", prose: "what you described", aka: ["something else", "not sure what", "other"] },
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
  /** Two lines a patient can decide on: how they work, and who they see. */
  approach: string;
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
    approach:
      "Board-certified psychiatrist, 14 years. Most of her patients are adults getting an ADHD evaluation for the first time, often alongside anxiety that nobody treated. She explains the reasoning behind every option and will say plainly when she thinks medication isn't the answer.",
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
    approach:
      "Psychiatric nurse practitioner, 9 years. Sees new patients faster than anyone on the team and keeps evening slots for people who can't step away from work. Practical, direct, and answers portal messages the same day where she can.",
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
    approach:
      "Psychiatrist, 18 years, focused on bipolar I and II and depression that hasn't responded to earlier treatment. Deliberate and data-driven — he tracks how you're doing between visits and coordinates with your therapist if you have one.",
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
    approach:
      "Psychiatrist, 11 years, trauma-focused — including veterans and survivors of assault. She paces the first visit around what you're ready to talk about, and is explicit that you never have to recount anything to be taken seriously.",
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
    approach:
      "Psychiatrist, 16 years, in perinatal and reproductive psychiatry as well as general anxiety and depression. Careful about medication in pregnancy and breastfeeding, and used to families being part of the conversation when you want them to be.",
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
    approach:
      "Psychiatric nurse practitioner, 7 years, treating anxiety and depression alongside alcohol and substance use. Harm-reduction minded: he'll work with where you actually are rather than requiring you to stop first.",
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

/**
 * Resolve a provider's whole slot list together.
 *
 * Resolving each offset on its own collapses any that fall outside clinic
 * hours onto the same opening — two identical times on one card, sometimes
 * out of order. Offering the same appointment twice is confusing for anyone
 * and worse for someone already struggling to choose, so slots are rolled
 * forward to stay unique and strictly increasing.
 */
export function resolveSlots(now: Date, hours: number[]): Date[] {
  const out: Date[] = [];
  for (const h of [...hours].sort((a, b) => a - b)) {
    const d = resolveSlot(now, h);
    const prev = out[out.length - 1];
    while (prev && d.getTime() <= prev.getTime()) {
      d.setMinutes(d.getMinutes() + 20);
      if (d.getHours() >= 20) {
        d.setDate(d.getDate() + 1);
        d.setHours(8, 20, 0, 0);
      }
    }
    out.push(d);
  }
  return out;
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

/** Psychology Today's directory is state-addressable; so is FindTreatment. */
const PT_SLUG: Record<string, string> = {};

/**
 * Point the directories at the patient's own state. "Here's a directory"
 * becomes "here's your list" for the cost of a URL segment.
 */
export function localise(r: Resource, code: string | null): Resource {
  const st = code && code !== OTHER_STATE ? US_STATES.find((x) => x.code === code) : undefined;
  if (!st) return r;
  const slug = PT_SLUG[st.code] ?? st.name.toLowerCase().replace(/\s+/g, "-");
  if (r.href.startsWith("https://www.psychologytoday.com")) {
    return {
      ...r,
      href: `https://www.psychologytoday.com/us/psychiatrists/${slug}`,
      what: `Psychiatrists in ${st.name}, filtered by insurance and who's taking new patients.`,
      action: `Open the ${st.name} directory`,
    };
  }
  if (r.href.startsWith("https://findtreatment.gov")) {
    return {
      ...r,
      href: `https://findtreatment.gov/results?location=${encodeURIComponent(st.name)}`,
      what: `Government directory, filtered to ${st.name}. Shows what each place accepts.`,
    };
  }
  return r;
}

export const CRISIS_RESOURCE: Resource = {
  name: "988 Suicide & Crisis Lifeline",
  what: "A trained counselor, any hour, anywhere in the US. Free and confidential.",
  action: "Call or text 988",
  href: "tel:988",
  detail: "Or chat at 988lifeline.org",
};

/**
 * Directories first, crisis line separately.
 *
 * This list used to lead with 988 for everyone, so a woman asking for help
 * with panic attacks was handed a suicide hotline as item one and the
 * directory she actually wanted as item four. 988 is in the header strip on
 * every screen of this product, so leading with it here bought nothing and
 * reframed her request as something it wasn't.
 */
export const NATIONAL_RESOURCES: Resource[] = [
  {
    name: "Psychology Today",
    what: "Search psychiatrists by state, insurance, and who's taking new patients.",
    action: "Open the directory",
    href: "https://www.psychologytoday.com/us/psychiatrists",
  },
  {
    name: "FindTreatment.gov",
    what: "Government directory. Filter by what your insurance covers.",
    action: "Open findtreatment.gov",
    href: "https://findtreatment.gov",
  },
  {
    name: "SAMHSA National Helpline",
    what: "Free referrals to treatment near you, 24/7, English and Spanish.",
    action: "Call 1-800-662-4357",
    href: "tel:18006624357",
  },
];


/* ------------------------------------------------------------------ */
/* Patient voices                                                      */
/*                                                                     */
/* Sample copy for the prototype — written for this demo, not real      */
/* patients, and labelled as such on the page. Real testimonials need    */
/* written authorisation and should never be paraphrased by a marketer.  */
/* ------------------------------------------------------------------ */

export interface Testimonial {
  quote: string;
  name: string;
  city: string;
  when: string;
  tint: Tint;
}

export const RATING = { score: 4.8, count: 212 };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I'd been told for years it was just stress. She actually read what I wrote before we met, and we started from there instead of the beginning.",
    name: "Marisol G.",
    city: "Austin",
    when: "October 2026",
    tint: "lilac",
  },
  {
    quote:
      "Filling out forms is the thing I put off for months. I talked into my phone instead and it was done in ten minutes.",
    name: "Jordan M.",
    city: "Houston",
    when: "August 2026",
    tint: "apricot",
  },
  {
    quote:
      "He never pushed medication on the first visit. He asked what I'd already tried and why I stopped.",
    name: "Thomas A.",
    city: "San Antonio",
    when: "October 2026",
    tint: "mint",
  },
  /* Written for the demo and kept for rotation; the page shows the first three. */
  {
    quote:
      "Booked on a Sunday night, seen on Wednesday. I'd been on a four-month waitlist somewhere else.",
    name: "Devin R.",
    city: "Fort Worth",
    when: "September 2026",
    tint: "sky",
  },
  {
    quote:
      "It told me my copay was $30 before I booked. That sounds small but it's the reason I went through with it.",
    name: "Priya S.",
    city: "Plano",
    when: "October 2026",
    tint: "sand",
  },
  {
    quote:
      "Hablamos en español desde la primera cita. No tuve que explicarle nada dos veces.",
    name: "Carmen V.",
    city: "El Paso",
    when: "September 2026",
    tint: "blush",
  },
];


/* ------------------------------------------------------------------ */
/* The first 90 days                                                   */
/*                                                                     */
/* Progress that only accumulates — no streaks, nothing that resets or  */
/* turns red. The follow-ups are deliberately unnamed: whether there's  */
/* a medication, and at what dose, isn't decided until the first visit. */
/* ------------------------------------------------------------------ */

export interface PlannedVisit {
  key: string;
  label: string;
  detail: string;
  /** Days after the first appointment. */
  offsetDays: number;
}

export const CARE_PLAN: PlannedVisit[] = [
  { key: "intake", label: "First visit", detail: "Evaluation · 50 minutes", offsetDays: 0 },
  { key: "f1", label: "Follow-up", detail: "25 minutes", offsetDays: 14 },
  { key: "f2", label: "Follow-up", detail: "25 minutes", offsetDays: 42 },
  { key: "review", label: "90-day review", detail: "Where to go from here · 25 minutes", offsetDays: 90 },
];
