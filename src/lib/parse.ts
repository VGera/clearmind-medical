import { CARRIERS, CONDITIONS, NEEDS, OTHER_PAYERS, OTHER_STATE, US_STATES } from "./data";
import type { Carrier, Need, OtherPayer } from "./types";

/** Smart apostrophes must survive normalisation — iOS inserts them by default,
 *  and "don’t want to be alive" has to match the same as "don't". */
const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc\u0060\u00b4]/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whole-phrase match, so "add" never fires inside "address". */
const has = (hay: string, needle: string) => new RegExp(`\\b${esc(needle)}\\b`).test(hay);

/* ------------------------------------------------------------------ */
/* Spoken / typed answer matching                                      */
/* ------------------------------------------------------------------ */

export function matchState(input: string): string | null {
  const t = norm(input);

  /* "Somewhere else" is a real answer, not a failure to answer. */
  if (/\b(somewhere else|some where else|another state|a different state|different state|other state|not texas|outside texas|out of state|out of texas|elsewhere|none of these)\b/.test(t)) {
    return OTHER_STATE;
  }

  // Full names first — "washington" before "wa", "indiana" before "in".
  for (const st of US_STATES) if (t.includes(norm(st.name).trim())) return st.code;

  /* A two-letter answer on its own is an abbreviation, whatever the casing. */
  const bare = input.trim().replace(/[^A-Za-z]/g, "");
  if (bare.length === 2) {
    const up = bare.toUpperCase();
    if (US_STATES.some((st) => st.code === up)) return up;
  }

  /* Inside a sentence, only an uppercase code counts, so "ok" and "in" stay
     ordinary words: "I'm in CA" matches, "I'm in a bad way" does not. */
  for (const st of US_STATES) if (new RegExp(`\\b${st.code}\\b`).test(input)) return st.code;

  return null;
}

export function matchYesNo(input: string): boolean | null {
  const t = norm(input);
  if (/\b(no|nope|nah|not yet|under|younger|minor|i'm 1[0-7]|im 1[0-7]|1[0-7] years)\b/.test(t)) return false;
  /* Negated or approximate ages must not reach the bare-number branch below:
     "I'm not 18" and "I'm almost 18" would otherwise read as yes. Returning
     null makes the question get asked again, which is the safe outcome. */
  if (/\b(not|isn't|aint|ain't|almost|nearly|turning|turn|about to|next month|next year)\b/.test(t)) return null;
  if (/\b(yes|yeah|yep|yup|correct|sure|i am|of course|definitely|over|older|adult)\b/.test(t)) return true;
  const age = t.match(/\b(\d{1,3})\b/);
  if (age) {
    const n = parseInt(age[1], 10);
    if (n >= 18 && n <= 110) return true;
    if (n >= 5 && n < 18) return false;
  }
  return null;
}

export function matchCarrier(input: string, allowVague = false): Carrier | null {
  const t = norm(input);
  if (/\b(blue cross|blue shield|bcbs|blue)\b/.test(t)) return "bcbs";
  if (/\b(united ?health ?care|unitedhealth|united|uhc|optum)\b/.test(t)) return "uhc";
  if (/\b(aetna|etna|athena)\b/.test(t)) return "aetna";
  if (/\b(cigna|signa|evernorth)\b/.test(t)) return "cigna";
  if (/\b(oscar)\b/.test(t)) return "oscar";
  if (matchOtherPayer(input)) return "other";
  if (allowVague && /\b(other|not sure|don't know|dont know|something else|none)\b/.test(t)) return "other";
  for (const c of CARRIERS) if (t.includes(norm(c.label).trim())) return c.id;
  return null;
}

export function matchOtherPayer(input: string): OtherPayer | null {
  const t = norm(input);
  if (/\b(medicaid|chip|star ?plus|star)\b/.test(t)) return "medicaid";
  if (/\b(medicare|advantage|part b|part d)\b/.test(t)) return "medicare";
  if (/\b(tricare|tri care|va|veterans)\b/.test(t)) return "tricare";
  if (/\b(no insurance|uninsured|pay myself|out of pocket|cash|self pay|selfpay|paying myself)\b/.test(t)) return "selfpay";
  if (/\b(commercial|employer|through work|my job|marketplace|private)\b/.test(t)) return "commercial";
  for (const p of OTHER_PAYERS) if (t.includes(norm(p.label).trim())) return p.id;
  return null;
}

export function matchConditions(input: string): string[] {
  const t = norm(input);
  const hits: string[] = [];
  for (const c of CONDITIONS) {
    if (c.id === "other") continue;
    if (c.aka.some((a) => has(t, a))) hits.push(c.id);
  }
  return hits;
}

export function matchNeed(input: string): Need | null {
  const t = norm(input);
  if (/\b(already (have|been)|have a diagnosis|diagnosed|refills?|continue|my meds|same medication|prescriptions?|dose|transfer|ran out)\b/.test(t)) return "have-dx";
  if (/\b(new diagnosis|get (a )?diagnos|evaluat|assess|tested|find out if|never been|first time|think i (have|might))\b/.test(t)) return "need-dx";
  if (/\b(not sure|unsure|don't know|dont know|no idea|confused|help me figure|need help|need some help|need someone|just need help)\b/.test(t)) return "unsure";
  for (const n of NEEDS) if (t.includes(norm(n.label).trim())) return n.id;
  return null;
}

/* ------------------------------------------------------------------ */
/* Safety                                                              */
/* ------------------------------------------------------------------ */

const CRISIS_PHRASES = [
  "kill myself", "killing myself", "end my life", "ending my life", "take my own life",
  "suicide", "suicidal", "don't want to be alive", "dont want to be alive",
  "better off dead", "no reason to live", "nothing to live for",
  "hurt myself", "harm myself", "harming myself", "self harm", "self-harm", "cutting myself",
  "overdose", "want to die", "wanna die", "wish i was dead", "wish i were dead",
];

export function detectCrisis(input: string): boolean {
  const t = norm(input);
  return CRISIS_PHRASES.some((p) => t.includes(p));
}

/* ------------------------------------------------------------------ */
/* Dictation cleanup for typed fields                                  */
/* ------------------------------------------------------------------ */

export function cleanSpokenEmail(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s+underscore\s+/g, "_")
    .replace(/\s+dash\s+|\s+hyphen\s+/g, "-")
    .replace(/\s/g, "");
}

export function cleanSpokenDigits(s: string): string {
  const words: Record<string, string> = {
    zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  };
  const digits = s
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => words[w] ?? w)
    .join("")
    .replace(/\D/g, "");
  return digits;
}

export function formatPhone(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (m) => m.toUpperCase()).replace(/\s+/g, " ").trim();
}
