import { CARRIERS, CONDITIONS, PROVIDERS, type Provider } from "./data";
import type { Intake } from "./types";

export interface Ranked {
  provider: Provider;
  score: number;
  inNetwork: boolean;
  reasons: string[];
  nextHours: number;
}

const proseFor = (id: string) => CONDITIONS.find((c) => c.id === id)?.prose ?? id;

export function rankProviders(intake: Intake): Ranked[] {
  const carrier = intake.carrier;
  const picked = intake.conditions.filter((c) => c !== "other");

  const ranked: Ranked[] = PROVIDERS.map((p) => {
    const overlap = picked.filter((c) => p.focus.includes(c));
    const inNetwork =
      intake.selfPay || carrier === null || carrier === "other"
        ? true
        : p.accepts.includes(carrier);

    const reasons: string[] = [];
    let score = 0;

    if (overlap.length) {
      score += overlap.length * 30;
      // Weight a primary-focus match (first two focus areas) higher.
      const primary = overlap.filter((c) => p.focus.indexOf(c) < 2);
      if (primary.length) {
        score += 20;
        reasons.push(`Specializes in ${primary.map(proseFor).join(" and ")}`);
      } else {
        reasons.push(`Treats ${overlap.map(proseFor).join(" and ")}`);
      }
    }

    if (inNetwork && carrier && carrier !== "other") {
      score += 40;
      /* True of everyone shown, so it earns a place only when nothing more
         specific has been said about this provider yet. */
      if (!reasons.length) reasons.push(`In-network with ${CARRIERS.find((c) => c.id === carrier)!.short}`);
    } else if (!inNetwork) {
      score -= 100;
    }

    /* Only state a need-based reason when it actually distinguishes this
       provider. Boilerplate dressed as a match factor is worse than silence. */
    const isPhysician = p.credential === "MD" || p.credential === "DO";
    const hasEvenings = p.slotHours.some((h) => h <= 12);
    if (intake.need === "have-dx") {
      score += 10;
      if (hasEvenings) reasons.push("Can pick up your prescriptions this week");
    } else if (intake.need === "need-dx" && isPhysician) {
      score += 12;
      reasons.push("Physician — does the full diagnostic evaluation");
    } else if (intake.need === "unsure") {
      score += 8;
    }

    const nextHours = p.slotHours[0];
    score += Math.max(0, 30 - nextHours / 4);
    if (nextHours <= 12) reasons.push("Free today or tomorrow");

    /* Worth saying plainly: for a lot of patients this is the deciding factor. */
    const otherLangs = p.languages.filter((l) => l !== "English");
    if (otherLangs.length && reasons.length < 2) {
      reasons.push(`Sees patients in ${otherLangs.join(" or ")}`);
    }

    score += (p.rating - 4.5) * 10;

    return { provider: p, score, inNetwork, reasons: reasons.slice(0, 2), nextHours };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Two headline cards, then everything else behind "Find more".
 * The second card is a different provider from the first; whether it is
 * genuinely the soonest is decided by the caller, which only uses that badge
 * when it is true.
 */
export function headline(ranked: Ranked[]): {
  recommended: Ranked;
  soonest: Ranked | null;
  rest: Ranked[];
} {
  const eligible = ranked.filter((r) => r.inNetwork);
  const pool = eligible.length ? eligible : ranked;
  const recommended = pool[0];
  const soonest =
    pool
      .filter((r) => r.provider.id !== recommended.provider.id)
      .sort((a, b) => a.nextHours - b.nextHours)[0] ?? null;
  const shown = new Set([recommended.provider.id, soonest?.provider.id]);
  const rest = ranked.filter((r) => !shown.has(r.provider.id));
  return { recommended, soonest, rest };
}
