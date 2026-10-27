"use client";

import React from "react";
import { PRESCRIPTIONS, RX_LABEL, type Prescription } from "@/lib/portal/mock";
import { Badge, Button, Card, Icon } from "../ui";

const TONE: Record<string, "sage" | "slate" | "clay" | "neutral"> = {
  sage: "sage", slate: "slate", sand: "clay", muted: "neutral",
};

/**
 * Status only — there is no "request refill" button anywhere here.
 *
 * A refill button implies the refill will happen, and for a controlled
 * substance it often can't: stimulants need a visit and can't simply be
 * re-sent. So every prescription routes to the same place a conversation
 * would, which is the message thread, and the screen says what's actually
 * required instead of taking a request it can't honour.
 */
function Row({ rx, onAsk }: { rx: Prescription; onAsk: (rx: Prescription) => void }) {
  const label = RX_LABEL[rx.status];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-ink">
            {rx.drug} <span className="text-muted">{rx.strength}</span>
          </h3>
          <p className="mt-0.5 text-[0.95rem] text-muted">{rx.directions}</p>
        </div>
        <Badge tone={TONE[label.tone]}>{label.text}</Badge>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-line pt-3.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Pharmacy</dt>
          <dd className="text-right text-ink">{rx.pharmacy}</dd>
        </div>
        {rx.lastFilled && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Last filled</dt>
            <dd className="text-ink">{rx.lastFilled}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Refills left</dt>
          <dd className="text-ink">{rx.refillsLeft}</dd>
        </div>
      </dl>

      {rx.status === "needs_visit" && (
        <p className="mt-3.5 rounded-xl bg-tint-sand px-3.5 py-3 text-[0.95rem] leading-relaxed text-tint-sandInk">
          {rx.controlled
            ? "This one is a controlled medication, so it can't be renewed by message — it needs a short visit. Your provider can usually fit that in quickly."
            : "This needs a visit before it can be renewed."}
        </p>
      )}

      <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={() => onAsk(rx)}>
        <Icon name="chat" className="h-4 w-4" />
        Ask about {rx.drug}
      </Button>
    </Card>
  );
}

export function Prescriptions({ onAsk }: { onAsk: (rx: Prescription) => void }) {
  return (
    <div>
      <h2 className="mb-1.5 font-serif text-[1.25rem] text-ink">Your medications</h2>
      <p className="mb-4 text-[0.95rem] leading-relaxed text-muted">
        Need a refill or a change? Message your provider — it goes to the same place a phone call would, and
        you&rsquo;ll have it in writing.
      </p>
      <div className="space-y-3">
        {PRESCRIPTIONS.map((rx) => (
          <Row key={rx.id} rx={rx} onAsk={onAsk} />
        ))}
      </div>
    </div>
  );
}
