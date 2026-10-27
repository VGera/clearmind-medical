"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CARRIERS, CONDITIONS, NEEDS, OTHER_PAYERS, OTHER_STATE, PRACTICE, stateName } from "@/lib/data";
import {
  detectCrisis, matchCarrier, matchConditions, matchNeed, matchOtherPayer, matchState,
  matchYesNo, parseBirthDate, parseName,
} from "@/lib/parse";
import { healthDiscover, healthEligibility, looksLikeMedicaid, maskMemberId } from "@/lib/verified/mock";
import type { HealthDiscovery, VPayer } from "@/lib/verified/types";
import { blockerFor, type Intake } from "@/lib/types";
import { useVoice } from "@/lib/voice";
import { Button, Card, Icon } from "./ui";
import { MicButton } from "./VoiceBits";

type Slot = "state" | "adult" | "carrier" | "otherPayer" | "conditions" | "symptoms" | "need" | "ready";

interface Chip { label: string; value: string }
interface Turn { lines: string[]; chips?: Chip[] }
interface Msg { id: number; who: "bot" | "user"; text: string; chips?: Chip[]; kind?: "crisis" | "blocked" }

const AGENT = "Mira";
const LOOKUP = "look it up for me";

function toCarrier(payer: VPayer): "bcbs" | "uhc" | "aetna" | "cigna" | "oscar" | "other" {
  const n = `${payer.name} ${payer.ids.join(" ")}`.toLowerCase();
  if (/blue cross|bcbs/.test(n)) return "bcbs";
  if (/unitedhealth|uhc/.test(n)) return "uhc";
  if (/aetna/.test(n)) return "aetna";
  if (/cigna/.test(n)) return "cigna";
  if (/oscar/.test(n)) return "oscar";
  return "other";
}

/** The chat's side-quest for 1-Click Health, so autofill isn't form-only. */
type Lookup =
  | null
  | { phase: "name" }
  | { phase: "dob"; first: string; last: string }
  | { phase: "pick"; results: HealthDiscovery[]; first: string; last: string; birthDate: string };

function nextSlot(i: Intake): Slot {
  if (!i.state) return "state";
  if (i.adult === null && !i.ageDeferred) return "adult";
  if (!i.carrier) return "carrier";
  if (i.carrier === "other" && !i.otherPayer) return "otherPayer";
  if (!i.conditions.length) return "conditions";
  if (!i.symptoms.trim()) return "symptoms";
  if (!i.need) return "need";
  return "ready";
}

function promptFor(slot: Slot): Turn {
  switch (slot) {
    case "state":
      return {
        lines: ["What state are you in? Type it, or tap one — an abbreviation is fine."],
        chips: [{ label: "Texas", value: "Texas" }, { label: "Somewhere else", value: "somewhere else" }],
      };
    case "adult":
      return {
        lines: ["And are you 18 or older?"],
        chips: [{ label: "Yes", value: "yes" }, { label: "No, under 18", value: "no, under 18" }],
      };
    case "carrier":
      return {
        lines: [
          "Do you have insurance? I can look it up from your name and birthday, so you don't have to find your card — or just tell me who it's with.",
        ],
        chips: [
          { label: "Look it up for me", value: LOOKUP },
          ...CARRIERS.map((c) => ({ label: c.short, value: c.label })),
        ],
      };
    case "otherPayer":
      return { lines: ["Who's it through?"], chips: OTHER_PAYERS.map((p) => ({ label: p.label, value: p.label })) };
    case "conditions":
      return {
        lines: ["Now the part that matters. What's been going on?"],
        chips: CONDITIONS.map((c) => ({ label: c.label, value: c.label })),
      };
    case "symptoms":
      return {
        lines: ["Anything else you'd like us to know? The mic is right there, if talking is easier."],
        chips: [{ label: "Nothing else", value: "skip" }],
      };
    case "need":
      return {
        lines: ["Last one. What would help most right now?"],
        chips: NEEDS.map((n) => ({ label: n.short, value: n.label })),
      };
    default:
      return { lines: ["That's everything I need. Let me find who fits."] };
  }
}

function reflect(slot: Slot, i: Intake): string[] {
  switch (slot) {
    case "state":
      return i.state === "TX" ? ["Texas — good, we can see you."] : [];
    case "adult":
      return i.ageDeferred ? ["No problem — we'll pick that up from your date of birth later."] : [];
    case "carrier": {
      const c = CARRIERS.find((x) => x.id === i.carrier);
      return c && i.carrier !== "other" ? [`${c.short} — we take that.`] : [];
    }
    case "otherPayer":
      return i.otherPayer === "selfpay"
        ? [`That's okay. Paying directly is $${PRACTICE.selfPay.intake} for the first visit, $${PRACTICE.selfPay.followUp} after.`]
        : [];
    case "conditions": {
      const labels = i.conditions
        .filter((c) => c !== "other")
        .map((c) => CONDITIONS.find((x) => x.id === c)?.prose)
        .filter((l): l is string => Boolean(l));
      if (!labels.length) {
        return i.conditions.includes("other") ? ["Thank you — I've written that down."] : [];
      }
      const joined = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : labels[0];
      return [`${joined.charAt(0).toUpperCase()}${joined.slice(1)} — that's what we do. Thank you for telling me.`];
    }
    case "symptoms":
      return ["Thank you. Your doctor will read that before you meet, so you won't have to start over."];
    default:
      return [];
  }
}

function blockedCopy(b: ReturnType<typeof blockerFor>, i: Intake): string {
  switch (b) {
    case "state":
      return `We're not available in ${stateName(i.state)} yet — we're working on going national, so do check back. In the meantime, let me give you some places that can help right now.`;
    case "minor":
      return "We only see adults 18 and over. You deserve someone trained for your age, not whoever's closest — let me show you how to find them.";
    case "medicare":
      return "We can't bill Medicare, so claims wouldn't go through. There are covered options, and you can still see us by paying directly. Let me show you both.";
    case "medicaid":
      return "We can't bill Medicaid, so claims wouldn't go through. There are covered options, and you can still see us by paying directly. Let me show you both.";
    default:
      return "";
  }
}

/** After a block there's nothing left to ask, but the person may still write.
 *  Rotate short acknowledgements rather than repeating one line forever. */
const AFTER_BLOCK = [
  "I can't book you here, but I'm still listening. The places below can help today.",
  "I'm reading. I can't get you an appointment with us, but those links are real options.",
  "Still here. If you'd rather talk to a person, our number is below — so is 988, any hour.",
];

const CRISIS_REPLY =
  "I want to stop there for a moment, because that matters more than the rest of this. If you're thinking about hurting yourself, please call or text 988 — it's free, and someone is there all night. If you're in danger right now, call 911. I'm not going anywhere.";

export function Chat({
  intake,
  patch,
  onComplete,
  onElsewhere,
  onSwitchToForm,
  active,
}: {
  intake: Intake;
  patch: (p: Partial<Intake>) => void;
  onComplete: () => void;
  onElsewhere: () => void;
  onSwitchToForm: () => void;
  /** False while the form half is showing — this stays mounted but idle. */
  active: boolean;
}) {
  const { sttSupported } = useVoice();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [finished, setFinished] = useState(false);
  /** Held while a crisis disclosure is on screen, so intake doesn't barrel on. */
  const [paused, setPaused] = useState<Turn | null>(null);
  const [lookup, setLookup] = useState<Lookup>(null);
  const idRef = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(false);
  const misses = useRef<Record<string, number>>({});
  const afterBlock = useRef(0);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  /* Scroll only the transcript. A smooth scrollIntoView also scrolls the
     document, which on iOS slides the composer under the keyboard. */
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, paused]);

  const say = useCallback(
    (lines: string[], chips?: Chip[], kind?: Msg["kind"]) => {
      if (!lines.length) {
        if (chips) setMsgs((m) => [...m, { id: ++idRef.current, who: "bot", text: "", chips }]);
        return;
      }
      setTyping(true);
      lines.forEach((line, idx) => {
        const t = setTimeout(() => {
          setMsgs((m) => [
            ...m,
            { id: ++idRef.current, who: "bot", text: line, chips: idx === lines.length - 1 ? chips : undefined, kind },
          ]);
          if (idx === lines.length - 1) setTyping(false);
        }, 620 * (idx + 1) + Math.min(line.length * 5, 900) * idx);
        timers.current.push(t);
      });
    },
    [],
  );

  useEffect(() => {
    if (!active || started.current) return;
    const slot = nextSlot(intake);
    /* Nothing left to ask — the effect below takes it to the providers. */
    if (slot === "ready") return;
    started.current = true;
    const p = promptFor(slot);
    say(
      [
        slot !== "state"
          ? `Hi — I'm ${AGENT}. I have what you already filled in, so I'll pick up from there.`
          : `Hi — I'm ${AGENT}. I'll ask a few things so we can find you the right person. Type, or just talk.`,
        ...p.lines,
      ],
      p.chips,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* If every answer is already in — because the form filled them, or the
     patient came back to this screen — don't sit on "let me find who fits".
     Show the providers. */
  useEffect(() => {
    if (!active || finished || blocked || paused) return;
    if (nextSlot(intake) !== "ready") return;
    setFinished(true);
    say([msgs.length ? "That's everything — here are your matches." : "You've already told me everything I need. Here are your matches."]);
    const t = setTimeout(onComplete, 1500);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, intake, finished, blocked, paused]);

  /** Applies a discovered plan exactly as the form path does. */
  const applyFound = useCallback(
    async (hit: HealthDiscovery, who: { first: string; last: string; birthDate: string }) => {
      const carrier = toCarrier(hit.payer);
      const medicaid = looksLikeMedicaid(hit.payer.name);
      const next: Partial<Intake> = {
        carrier,
        otherPayer: hit.isMedicare ? "medicare" : medicaid ? "medicaid" : carrier === "other" ? "commercial" : null,
        selfPay: false,
        memberId: hit.memberId,
        discovery: hit,
        insuranceSource: "autofill",
        account: { ...intake.account, legalFirst: who.first, legalLast: who.last, dob: who.birthDate },
      };
      patch(next);
      setLookup(null);

      const merged = { ...intake, ...next } as Intake;
      const b = blockerFor(merged);
      if (b) {
        setBlocked(true);
        say([`I found your ${hit.payer.name}.`, blockedCopy(b, merged)], undefined, "blocked");
        return;
      }

      say([
        `Found it — ${hit.payer.name}, member ID ${maskMemberId(hit.memberId)}. That's on file now, so you won't be asked for your card.`,
      ]);

      if (!hit.isMedicare && !medicaid) {
        const elig = await healthEligibility(hit, {
          firstName: who.first,
          lastName: who.last,
          birthDate: who.birthDate,
        });
        if (elig) patch({ eligibility: elig });
      }

      const upcoming = nextSlot({ ...merged, symptoms: merged.symptoms });
      const p = promptFor(upcoming);
      const t = setTimeout(() => say(p.lines, p.chips), 1400);
      timers.current.push(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intake, patch, say],
  );

  /** Returns true when the message was consumed by the lookup. */
  const handleLookup = useCallback(
    (text: string): boolean => {
      if (!lookup) return false;

      if (/^(cancel|stop|never ?mind|skip|forget it)$/i.test(text.trim())) {
        setLookup(null);
        const p = promptFor("carrier");
        say(["No problem — which one is it?"], p.chips);
        return true;
      }

      if (lookup.phase === "name" || lookup.phase === "dob") {
        /* A carrier answer here means they'd rather just name it. */
        const direct = matchCarrier(text, false);
        if (direct || text.trim().toLowerCase() === LOOKUP) {
          setLookup(null);
          if (!direct) {
            const p = promptFor("carrier");
            say(["We're already looking — I just need your full name, first and last."], p.chips);
            return true;
          }
          return false; // let the normal carrier handling take it
        }
      }

      if (lookup.phase === "name") {
        const n = parseName(text);
        if (!n) {
          say(["I need a first and last name to search — what's your full name?"]);
          return true;
        }
        setLookup({ phase: "dob", first: n.first, last: n.last });
        say([`Thanks, ${n.first}. And your date of birth? Any format works — 05/05/1990 is fine.`]);
        return true;
      }

      if (lookup.phase === "dob") {
        const dob = parseBirthDate(text);
        if (!dob) {
          say(["I couldn't read that as a date. Could you write it like 05/05/1990?"]);
          return true;
        }
        const who = { first: lookup.first, last: lookup.last, birthDate: dob };
        say(["One moment — checking with your insurer."]);
        void (async () => {
          const res = await healthDiscover({
            firstName: who.first,
            lastName: who.last,
            birthDate: dob,
            state: intake.state,
          });
          if (res.status === "found" && res.results.length === 1) {
            await applyFound(res.results[0], who);
            return;
          }
          if (res.status === "found") {
            setLookup({ phase: "pick", results: res.results, ...who });
            say(
              ["I found more than one. Which would you like to use?"],
              res.results.map((r) => ({ label: r.payer.name, value: r.payer.name })),
            );
            return;
          }
          setLookup(null);
          patch({ account: { ...intake.account, legalFirst: who.first, legalLast: who.last, dob } });
          say(
            [
              "I couldn't find a plan under that name and birthday — that happens for about one in five people, and it doesn't mean anything is wrong. Which insurer is it?",
            ],
            promptFor("carrier").chips?.filter((c) => c.value !== LOOKUP),
          );
        })();
        return true;
      }

      // phase === "pick"
      const chosen =
        lookup.results.find((r) => r.payer.name.toLowerCase() === text.trim().toLowerCase()) ??
        lookup.results.find((r) => text.toLowerCase().includes(r.payer.name.split(" ")[0].toLowerCase()));
      if (!chosen) {
        say(["Sorry — tap whichever of those two is yours."]);
        return true;
      }
      void applyFound(chosen, { first: lookup.first, last: lookup.last, birthDate: lookup.birthDate });
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lookup, intake, patch, say, applyFound],
  );

  const handle = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || finished) return;
      /* Typing during a crisis pause means they're ready to continue. */
      const pending = paused;
      if (pending) setPaused(null);
      setMsgs((m) => [...m, { id: ++idRef.current, who: "user", text }]);
      setDraft("");
      if (composer.current) composer.current.style.height = "auto";

      const crisis = detectCrisis(text);

      /* After a block we stop filling slots, but we keep listening — the
         previous turn may have ended with "I'm not going anywhere". */
      if (blocked) {
        const n = afterBlock.current;
        afterBlock.current = n + 1;
        say(
          crisis ? [CRISIS_REPLY] : [AFTER_BLOCK[n % AFTER_BLOCK.length]],
          undefined,
          crisis ? "crisis" : undefined,
        );
        return;
      }

      if (handleLookup(text)) return;

      const asking = nextSlot(intake);

      if (asking === "carrier" && text.trim().toLowerCase() === LOOKUP) {
        setLookup({ phase: "name" });
        say(["Happy to. What's your full name — first and last? It goes on your chart either way, so you won't be asked twice."]);
        return;
      }

      const next: Intake = { ...intake };
      const filled: Slot[] = [];

      /* One sentence can answer several questions — but only the ones it was
         plausibly answering. Running every matcher on every message made a
         stray word in the state answer skip the most important question. */
      if (!next.state) {
        const st = matchState(text);
        if (st) {
          next.state = st;
          filled.push("state");
        } else if (asking === "state") {
          /* Whatever they typed, they answered. If we can't name the state we
             take it as "not Texas" rather than asking again — re-asking until
             someone taps Texas is coercive, not careful. */
          next.state = OTHER_STATE;
          filled.push("state");
        }
      }
      if (next.adult === null && (asking === "adult" || /\b\d{2}\b/.test(text))) {
        const yn = matchYesNo(text);
        if (yn !== null) {
          next.adult = yn;
          filled.push("adult");
        } else if (asking === "adult" && (misses.current.adult ?? 0) >= 1) {
          /* Don't guess someone's age, and don't keep asking. We confirm it
             from the date of birth on the account screen instead. */
          next.ageDeferred = true;
          filled.push("adult");
        }
      }
      if (!next.carrier && asking === "carrier" && (misses.current.carrier ?? 0) >= 1) {
        /* Second miss: treat it as "other or not sure" and keep moving. */
        next.carrier = "other";
        filled.push("carrier");
      } else if (!next.carrier) {
        const c = matchCarrier(text, asking === "carrier");
        if (c) {
          next.carrier = c;
          filled.push("carrier");
          const sub = c === "other" ? matchOtherPayer(text) : null;
          if (sub) { next.otherPayer = sub; next.selfPay = sub === "selfpay"; filled.push("otherPayer"); }
        }
      } else if (next.carrier === "other" && !next.otherPayer) {
        const sub = matchOtherPayer(text);
        if (sub) {
          next.otherPayer = sub;
          next.selfPay = sub === "selfpay";
          filled.push("otherPayer");
        } else if (asking === "otherPayer" && (misses.current.otherPayer ?? 0) >= 1) {
          /* "We'll check your benefits" blocks nothing, so it's the safe default. */
          next.otherPayer = "commercial";
          filled.push("otherPayer");
        }
      }

      const scanConditions = asking === "conditions" || asking === "symptoms";
      const hits = scanConditions ? matchConditions(text) : [];
      if (hits.length) {
        next.conditions = Array.from(new Set([...next.conditions, ...hits]));
        filled.push("conditions");
      }
      if (!next.need && asking === "need") {
        const n = matchNeed(text);
        if (n) { next.need = n; filled.push("need"); }
        else if ((misses.current.need ?? 0) >= 1) {
          /* Second miss: "not sure" is one of the real answers anyway. */
          next.need = "unsure";
          filled.push("need");
        }
      }

      if (asking === "symptoms") {
        next.symptoms = /^skip$|^nothing else/i.test(text) ? "(nothing else to add)" : text;
        filled.push("symptoms");
      } else if (asking === "conditions" && !hits.length) {
        if (!next.symptoms.trim()) next.symptoms = text;
        next.conditions = ["other"];
        filled.push("conditions");
      }

      /* Anything that trips the crisis check is kept verbatim regardless of
         which question was being asked — otherwise a disclosure bundled with
         a condition word existed only in this component's local state. */
      if (crisis) {
        next.crisisDisclosed = true;
        if (!next.symptoms.includes(text)) {
          next.symptoms = `${next.symptoms} ${text}`.trim();
        }
      }
      /* An unparsed answer is still the patient's words. Keep them. */
      if (!filled.length && !crisis && text.length > 25 && !next.symptoms.includes(text)) {
        next.symptoms = `${next.symptoms} ${text}`.trim();
      }

      patch({
        state: next.state, adult: next.adult, ageDeferred: next.ageDeferred,
        carrier: next.carrier, otherPayer: next.otherPayer,
        selfPay: next.selfPay, conditions: next.conditions, symptoms: next.symptoms, need: next.need,
        crisisDisclosed: next.crisisDisclosed,
      });

      const b = blockerFor(next);
      if (b) {
        setBlocked(true);
        say(crisis ? [CRISIS_REPLY, blockedCopy(b, next)] : [blockedCopy(b, next)], undefined, crisis ? "crisis" : "blocked");
        return;
      }

      const reflections = filled.flatMap((f) => reflect(f, next));
      const upcoming = nextSlot(next);

      let turn: Turn;
      if (upcoming === "ready") {
        turn = { lines: [...reflections, "That's everything. Give me a second — I'm finding who fits."] };
      } else if (upcoming === asking && !filled.length) {
        /* Didn't parse. Say so once, warmly, with the options in reach — then
           never again for this question. The chips stay on screen either way. */
        const seen = misses.current[asking] ?? 0;
        misses.current[asking] = seen + 1;
        /* Say something different each time, and never a third time — every
           question now has a default it falls back to instead of repeating. */
        turn = {
          lines: [
            ...reflections,
            seen === 0
              ? "Sorry, that one's on me — I didn't follow. The options below will do it."
              : "That's okay — tap whichever is closest and we'll keep moving.",
          ],
          chips: promptFor(upcoming).chips,
        };
      } else {
        const p = promptFor(upcoming);
        turn = { lines: [...reflections, ...p.lines], chips: p.chips };
      }

      /* A disclosure gets the room to itself. The next question waits until
         the patient says they're ready for it. */
      if (crisis) {
        say([CRISIS_REPLY], undefined, "crisis");
        setPaused(turn);
        return;
      }

      if (upcoming === "ready") {
        setFinished(true);
        say(turn.lines);
        const t = setTimeout(onComplete, 2600);
        timers.current.push(t);
        return;
      }
      say(turn.lines, turn.chips);
      void pending;
    },
    [blocked, finished, paused, intake, patch, say, onComplete, handleLookup],
  );

  const resume = () => {
    if (!paused) return;
    const turn = paused;
    setPaused(null);
    if (nextSlot(intake) === "ready") {
      setFinished(true);
      say(turn.lines);
      const t = setTimeout(onComplete, 2600);
      timers.current.push(t);
      return;
    }
    say(turn.lines, turn.chips);
  };

  const lastChips = [...msgs].reverse().find((m) => m.who === "bot" && m.chips)?.chips;
  /* Stale chips must not stay tappable while a free-text answer is expected —
     otherwise "Look it up for me" arrives as the answer to "your full name?".
     The "pick" phase sets its own chips, so it keeps them. */
  const awaitingFreeText = lookup !== null && lookup.phase !== "pick";
  const showChips =
    !typing && !blocked && !finished && !paused && !awaitingFreeText ? lastChips : undefined;

  return (
    <div>
      <h1 className="sr-only">Talk to {AGENT} about the care you need</h1>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 font-serif text-slate-600">
            {AGENT[0]}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{AGENT}</p>
            <p className="truncate text-xs text-muted">Here to listen, not to diagnose</p>
          </div>
        </div>
        <button
          onClick={onSwitchToForm}
          aria-label="Switch to the form instead of chatting"
          className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-1.5 px-2 text-sm text-slate-600"
        >
          <Icon name="list" className="h-5 w-5" />
          <span className="hidden sm:inline">Use the form</span>
        </button>
      </div>

      <Card className="flex flex-col p-0">
        <div
          ref={scroller}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={`Conversation with ${AGENT}`}
          className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-5"
          style={{ minHeight: "min(22rem, 40dvh)", maxHeight: "min(62dvh, 34rem)" }}
        >
          {msgs.map((m) =>
            m.text ? (
              <div key={m.id} className={`rise flex ${m.who === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] break-words rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${
                    m.who === "user"
                      ? "bg-slate-500 text-white"
                      : m.kind === "crisis" || m.kind === "blocked"
                        ? "border border-alert-500/40 bg-alert-100/60 text-ink"
                        : "border border-line bg-paper text-ink"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ) : null,
          )}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-line bg-paper px-4 py-3.5" role="status" aria-label={`${AGENT} is typing`}>
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="dot-1 h-2 w-2 rounded-full bg-slate-300" />
                  <span className="dot-2 h-2 w-2 rounded-full bg-slate-300" />
                  <span className="dot-3 h-2 w-2 rounded-full bg-slate-300" />
                </span>
              </div>
            </div>
          )}

          <div />
        </div>

        {(paused || blocked) && (
          <div className="rise flex flex-wrap gap-2 border-t border-line px-3 py-3 sm:px-4">
            <a
              href="tel:988"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-alert-500 px-4 text-[0.95rem] font-medium text-white"
            >
              <Icon name="phone" className="h-4 w-4" />
              Call or text 988
            </a>
            <a
              href={PRACTICE.phoneHref}
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-line bg-panel px-4 text-[0.95rem] text-ink"
            >
              <Icon name="phone" className="h-4 w-4" />
              Call us
            </a>
            {paused && (
              <button
                onClick={resume}
                className="inline-flex min-h-[2.75rem] items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-[0.95rem] text-slate-600"
              >
                I&rsquo;m okay to keep going
              </button>
            )}
            {blocked && (
              <Button onClick={onElsewhere}>
                Where to go instead
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {showChips && showChips.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-line px-3 py-3 sm:px-4">
            {showChips.map((c) => (
              <button
                key={c.label}
                onClick={() => handle(c.value)}
                className="min-h-[2.75rem] rounded-full border border-line bg-panel px-4 text-[0.95rem] text-ink transition hover:border-slate-300 hover:bg-slate-50"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {!finished && (
          <form
            className="flex items-end gap-2 border-t border-line px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              handle(draft);
            }}
          >
            <textarea
              ref={composer}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handle(draft); }
              }}
              placeholder={sttSupported ? "Type, or tap the mic…" : "Type your answer…"}
              aria-label="Your message"
              className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-line bg-panel px-3.5 py-2.5 text-[1rem] text-ink placeholder:text-faint focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <MicButton
              target="chat"
              label="Answer out loud"
              continuous
              onResult={(text, isFinal) => {
                setDraft(text);
                if (isFinal) {
                  const t = setTimeout(() => handle(text), 220);
                  timers.current.push(t);
                }
              }}
            />
            <Button type="submit" disabled={!draft.trim()} className="h-11 w-11 !min-h-0 !px-0">
              <span className="sr-only">Send</span>
              <Icon name="arrow" className="h-5 w-5" />
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        In crisis? Call or text{" "}
        <a href="tel:988" className="font-medium text-slate-600 underline decoration-current underline-offset-2">988</a>.
        Or call us at{" "}
        <a href={PRACTICE.phoneHref} className="font-medium text-slate-600 underline decoration-current underline-offset-2">
          {PRACTICE.phone}
        </a>.
      </p>
    </div>
  );
}
