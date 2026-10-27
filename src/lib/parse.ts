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

/* Someone asked "what state are you in?" very often answers with a city.
   Texas first and in depth, because that's who we can actually see; a
   scattering of large cities elsewhere so the off-ramp is aimed correctly. */
const CITIES: Record<string, string> = {
  houston: "TX", "san antonio": "TX", dallas: "TX", austin: "TX", "fort worth": "TX",
  "el paso": "TX", arlington: "TX", "corpus christi": "TX", plano: "TX", laredo: "TX",
  lubbock: "TX", garland: "TX", irving: "TX", amarillo: "TX", "grand prairie": "TX",
  brownsville: "TX", mckinney: "TX", frisco: "TX", pasadena: "TX", killeen: "TX",
  mesquite: "TX", midland: "TX", denton: "TX", waco: "TX", "round rock": "TX",
  abilene: "TX", odessa: "TX", beaumont: "TX", tyler: "TX", "college station": "TX",
  "san marcos": "TX", galveston: "TX", "sugar land": "TX", conroe: "TX", katy: "TX",
  "the woodlands": "TX", "cedar park": "TX", pflugerville: "TX", georgetown: "TX",
  "new york": "NY", brooklyn: "NY", queens: "NY", bronx: "NY", buffalo: "NY",
  "los angeles": "CA", "san diego": "CA", "san jose": "CA", "san francisco": "CA",
  sacramento: "CA", oakland: "CA", fresno: "CA", "long beach": "CA",
  chicago: "IL", phoenix: "AZ", tucson: "AZ", mesa: "AZ", philadelphia: "PA",
  pittsburgh: "PA", jacksonville: "FL", miami: "FL", tampa: "FL", orlando: "FL",
  columbus: "OH", cleveland: "OH", cincinnati: "OH", charlotte: "NC", raleigh: "NC",
  indianapolis: "IN", seattle: "WA", spokane: "WA", denver: "CO", "colorado springs": "CO",
  boston: "MA", nashville: "TN", memphis: "TN", detroit: "MI", "oklahoma city": "OK",
  tulsa: "OK", portland: "OR", "las vegas": "NV", reno: "NV", louisville: "KY",
  baltimore: "MD", milwaukee: "WI", albuquerque: "NM", "kansas city": "MO",
  "st louis": "MO", atlanta: "GA", savannah: "GA", "new orleans": "LA",
  "baton rouge": "LA", shreveport: "LA", "salt lake city": "UT", omaha: "NE",
  minneapolis: "MN", "st paul": "MN", wichita: "KS", "little rock": "AR",
  jackson: "MS", birmingham: "AL", boise: "ID", honolulu: "HI", anchorage: "AK",
  richmond: "VA", "virginia beach": "VA", newark: "NJ", "jersey city": "NJ",
  hartford: "CT", providence: "RI", charleston: "SC", columbia: "SC",
  "des moines": "IA", "sioux falls": "SD", fargo: "ND", billings: "MT",
  cheyenne: "WY", wilmington: "DE", manchester: "NH", burlington: "VT",
  portlandme: "ME", morgantown: "WV", "washington dc": "DC",
};

const MULTI_WORD_CITIES = Object.keys(CITIES)
  .filter((c) => c.includes(" "))
  .sort((a, b) => b.length - a.length);
const SINGLE_WORD_CITIES = Object.keys(CITIES).filter((c) => !c.includes(" "));

/** "skip", "I'd rather not say" — a refusal, not a failed answer. */
export function isDeclined(input: string): boolean {
  return /\b(skip|pass|next|rather not|prefer not|no comment|not saying|won't say|wont say|none of your|private|decline)\b/.test(
    norm(input),
  );
}

/** "not sure", "I don't know" — willing but unable to answer. */
export function isUnsure(input: string): boolean {
  return /\b(not sure|unsure|no idea|dunno|don't know|dont know|do not know|can't remember|cant remember|no clue|idk)\b/.test(
    norm(input),
  );
}

export function matchState(input: string): string | null {
  const t = norm(input);

  /* A refusal or a shrug is never a geography answer. Returning null lets the
     caller re-ask once and then default, rather than silently concluding the
     patient lives somewhere we don't serve. */
  if (isDeclined(input) || isUnsure(input)) return null;

  /* "Somewhere else" is a real answer, not a failure to answer. */
  if (/\b(somewhere else|some where else|another state|a different state|different state|other state|not texas|outside texas|out of state|out of texas|elsewhere|none of these)\b/.test(t)) {
    return OTHER_STATE;
  }

  /* Multi-word cities before state names, because several contain one:
     "Kansas City" is Missouri, not Kansas. */
  for (const city of MULTI_WORD_CITIES) if (has(t, city)) return CITIES[city];

  // Full names next — "washington" before "wa", "indiana" before "in".
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

  /* Single-word cities last, so "in Texas, near Tulsa" stays Texas. */
  for (const city of SINGLE_WORD_CITIES) if (has(t, city)) return CITIES[city];

  return null;
}

export function matchYesNo(input: string): boolean | null {
  const t = norm(input);
  if (/\b(no|nope|nah|not yet|under|younger|minor|i'm 1[0-7]|im 1[0-7]|1[0-7] years)\b/.test(t)) return false;
  /* "I'm not 18", "almost 18", "turning 18 next month" all mean under 18, and
     discarding them sent a minor three steps further in before the date-of-
     birth gate stopped them. The 18 inside "not 18" must not be read as a
     declaration of being 18, so it is stripped before looking for a real age —
     that way "I'm not 18, I'm 45" still reads as an adult. */
  const NEG_18 = /\b(not|isn't|isnt|aint|ain't|almost|nearly|turning|turn|about to) (yet )?(18|eighteen|an adult|old enough)\b/;
  const UNDER_PHRASE = /\b(not an adult|not old enough|still a kid|still a minor)\b/;
  if (NEG_18.test(t) || UNDER_PHRASE.test(t)) {
    const rest = t.replace(NEG_18, " ").replace(UNDER_PHRASE, " ");
    return /\b(1[89]|[2-9]\d|10\d)\b/.test(rest);
  }
  /* Anything else negated or approximate stays ambiguous — "I'll be 18 next
     month" included. Ask again rather than guess someone's age. */
  if (/\b(not|isn't|isnt|aint|ain't|almost|nearly|turning|turn|about to|next month|next year)\b/.test(t)) return null;
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
  if (
    /\b(no insurance|no coverage|uninsured|not insured|pay myself|out of pocket|cash|self pay|selfpay|paying myself|pay directly|paying directly)\b/.test(t) ||
    /\b(don't|dont|do not|doesn't|doesnt|haven't|havent) (have|got) (any )?(insurance|coverage|a plan)\b/.test(t) ||
    /\b(have|got) (no|none) (insurance|coverage)\b/.test(t) ||
    /\bwithout insurance\b/.test(t) ||
    /^ (none|nothing|nope|no|n\/a|na) $/.test(t)
  ) {
    return "selfpay";
  }
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
  "not want to be alive", "don't want to live", "dont want to live",
  "don't want to be here", "dont want to be here", "not be here anymore",
  "better off dead", "no reason to live", "nothing to live for", "end it all",
  "hurt myself", "harm myself", "harming myself", "self harm", "self-harm", "cutting myself",
  "overdose", "want to die", "wanna die", "want to be dead", "wish i was dead",
  "wish i were dead", "rather be dead",
];

/* Dropped before matching. Someone ashamed of saying this hedges it, and
   "I don't really want to be alive" is the commoner phrasing — a single
   adverb used to defeat the whole safety net. */
const HEDGES =
  /\b(really|actually|even|just|simply|honestly|truly|literally|kind of|kinda|sort of|sorta|somewhat|a bit|a little|slightly|maybe|sometimes|often|usually|always|definitely|probably|half|totally|completely|basically|pretty much|more or less)\b/g;

/* "I want to die my hair" is not a disclosure. Stripped before matching so
   the phrase list can stay short and readable. */
const BENIGN = /\b(die|dye|dying|dyeing) (my|your|her|his|their|the) hair\b/g;

export function detectCrisis(input: string): boolean {
  const t = norm(input)
    .replace(BENIGN, " ")
    .replace(HEDGES, " ")
    /* "wanna"/"gonna" are how this is actually typed. */
    .replace(/\bwanna\b/g, "want to")
    .replace(/\bgonna\b/g, "going to")
    .replace(/\s+/g, " ");
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

/* ------------------------------------------------------------------ */
/* Dates and names, for the chat's insurance lookup                     */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** Accepts the ways people actually write a birthday. Returns yyyy-MM-dd. */
export function parseBirthDate(input: string): string | null {
  const t = input.toLowerCase().trim();
  const iso = (y: number, m: number, d: number): string | null => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const year = y < 100 ? (y > 30 ? 1900 + y : 2000 + y) : y;
    const now = new Date().getFullYear();
    if (year < 1900 || year > now) return null;
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  // 1990-05-05
  let m = t.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return iso(+m[1], +m[2], +m[3]);

  // 05/05/1990 or 5-5-90  (US order)
  m = t.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) return iso(+m[3], +m[1], +m[2]);

  // May 5 1990  /  5 May 1990
  const mon = MONTHS.findIndex((name) => new RegExp(`\\b${name.slice(0, 3)}`).test(t));
  if (mon >= 0) {
    const nums = t.match(/\b\d{1,4}\b/g);
    if (nums && nums.length >= 2) {
      const day = nums.find((n) => +n >= 1 && +n <= 31);
      const year = nums.find((n) => n.length === 4) ?? nums[nums.length - 1];
      if (day && year) return iso(+year, mon + 1, +day);
    }
  }
  return null;
}

/** "ada lovelace" -> { first, last }. Middle names fold into the first name. */
export function parseName(input: string): { first: string; last: string } | null {
  const parts = input
    .replace(/\b(my name is|my name'?s|i am|i'?m|it'?s|this is|call me|name)\b/gi, " ")
    .replace(/[^A-Za-z'\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return null;
  return { first: titleCase(parts.slice(0, -1).join(" ")), last: titleCase(parts[parts.length - 1]) };
}
