import { resolveSlot } from "../data";

/**
 * Portal data. Fictional, in-memory, no network — the shape a real build would
 * fetch, so the components are written against something realistic.
 */

export type VisitStatus = "upcoming" | "completed" | "cancelled";

export interface Visit {
  id: string;
  providerId: string;
  providerName: string;
  /** Hours from now; negative is in the past. */
  hours: number;
  minutes: number;
  kind: string;
  status: VisitStatus;
  /**
   * Patient-facing summary only: what was agreed and what happens next.
   * The clinical note is deliberately not here — see VisitDetail.
   */
  summary?: { agreed: string[]; next: string };
}

export type RxStatus = "active" | "sent" | "pending" | "needs_visit";

export interface Prescription {
  id: string;
  drug: string;
  strength: string;
  directions: string;
  status: RxStatus;
  pharmacy: string;
  lastFilled?: string;
  refillsLeft: number;
  /** Controlled substances can't simply be re-sent; the UI has to say so. */
  controlled?: boolean;
}

export interface Message {
  id: string;
  from: "patient" | "care-team";
  author?: string;
  text: string;
  /** Minutes ago. */
  ago: number;
}

export const VISITS: Visit[] = [
  {
    id: "v3",
    providerId: "okafor",
    providerName: "Dr. Amara Okafor",
    hours: 26,
    minutes: 50,
    kind: "Follow-up",
    status: "upcoming",
  },
  {
    id: "v2",
    providerId: "okafor",
    providerName: "Dr. Amara Okafor",
    hours: -336,
    minutes: 25,
    kind: "Follow-up",
    status: "completed",
    summary: {
      agreed: [
        "Keep the current dose for another four weeks.",
        "Track sleep on the nights it's worst — no app needed, a note on your phone is fine.",
        "Caffeine before noon only, as an experiment, not a rule.",
      ],
      next: "Follow-up in four weeks. Message any time before then.",
    },
  },
  {
    id: "v1",
    providerId: "okafor",
    providerName: "Dr. Amara Okafor",
    hours: -1010,
    minutes: 50,
    kind: "First visit",
    status: "completed",
    summary: {
      agreed: [
        "Start a low dose and review before changing anything.",
        "Expect the first two weeks to feel like not much. That's normal.",
        "Call us rather than stopping on your own if something feels wrong.",
      ],
      next: "Follow-up in two weeks.",
    },
  },
];

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx1",
    drug: "Sertraline",
    strength: "50 mg",
    directions: "One tablet each morning",
    status: "active",
    pharmacy: "H-E-B Pharmacy, S Congress Ave",
    lastFilled: "12 days ago",
    refillsLeft: 2,
  },
  {
    id: "rx2",
    drug: "Hydroxyzine",
    strength: "25 mg",
    directions: "One tablet as needed, up to twice a day",
    status: "sent",
    pharmacy: "H-E-B Pharmacy, S Congress Ave",
    lastFilled: "Sent to the pharmacy today",
    refillsLeft: 0,
  },
  {
    id: "rx3",
    drug: "Lisdexamfetamine",
    strength: "30 mg",
    directions: "One capsule each morning",
    status: "needs_visit",
    pharmacy: "H-E-B Pharmacy, S Congress Ave",
    lastFilled: "26 days ago",
    refillsLeft: 0,
    controlled: true,
  },
];

export const THREAD: Message[] = [
  {
    id: "m1",
    from: "care-team",
    author: "Dr. Amara Okafor",
    text: "Good to meet you today. I've sent the sertraline to your pharmacy — it should be ready this afternoon. Message me if the first week is rough; we don't have to wait for the follow-up.",
    ago: 60 * 24 * 14,
  },
  {
    id: "m2",
    from: "patient",
    text: "Thank you. The first few days were foggy but it's settled.",
    ago: 60 * 24 * 11,
  },
  {
    id: "m3",
    from: "care-team",
    author: "Dr. Amara Okafor",
    text: "That's the usual pattern and a good sign. Keep going and we'll look at it properly at the follow-up.",
    ago: 60 * 24 * 11 - 300,
  },
];

export const RX_LABEL: Record<RxStatus, { text: string; tone: "sage" | "slate" | "sand" | "muted" }> = {
  active: { text: "Active", tone: "sage" },
  sent: { text: "Sent to pharmacy", tone: "slate" },
  pending: { text: "Waiting on your provider", tone: "sand" },
  needs_visit: { text: "Needs a visit to renew", tone: "sand" },
};

/**
 * Offsets are relative to "now", so without snapping a fixture booked "+26h"
 * renders at whatever o'clock the page happens to be opened — a visit at
 * 12:04 AM. resolveSlot keeps every displayed time inside clinic hours, and
 * it's the same helper the booking flow uses, so the portal can never show a
 * time the funnel wouldn't have offered.
 */
export function visitDate(now: Date, hours: number): Date {
  return resolveSlot(now, hours);
}

export function when(d: Date, now: Date): string {
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today at ${time}`;
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${time}`;
}

export function agoLabel(mins: number): string {
  if (mins < 1) return "just now";
  if (mins < 60) return `${Math.round(mins)} min ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** The join window: a visit can be entered shortly before it starts. */
export const JOIN_WINDOW_MINUTES = 15;

/**
 * What this patient told us at intake. Kept here so the portal can rank
 * providers with the same scoring the booking flow uses, instead of a second
 * ad-hoc ordering that would contradict it. Derived from the fixtures above:
 * sertraline and hydroxyzine for depression and anxiety, lisdexamfetamine for
 * ADHD, already diagnosed, BCBS.
 */
export const PATIENT_INTAKE = {
  carrier: "bcbs" as const,
  selfPay: false,
  conditions: ["depression", "anxiety", "adhd"],
  need: "have-dx" as const,
};
