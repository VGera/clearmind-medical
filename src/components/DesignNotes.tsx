"use client";

import React, { useEffect, useRef } from "react";
import { Button, Card, Icon } from "./ui";

const NOTES: { h: string; p: string }[] = [
  {
    h: "Eight phases, six screens",
    p: "Insurance is folded into the fit check, because \"which plan\" IS a fit question. Conditions, the free-text description, and what-kind-of-help are one thought, so they're one screen. Three screens before anyone sees a provider.",
  },
  {
    h: "Fewer words, on purpose",
    p: "Someone in a depressive episode has very little bandwidth for reading. So: one question per section, short labels, helper text only where its absence would cause a mistake. Anything the patient doesn't need in order to answer was cut.",
  },
  {
    h: "The limits are on the landing page",
    p: "Texas-only and no-Medicare/Medicaid are stated before anyone invests effort. It costs top-of-funnel and buys back the thing that matters more: nobody describes their trauma in a text box and then gets told we can't help.",
  },
  {
    h: "Every dead end is a hand-off",
    p: "Out of state, under 18, Medicare, Medicaid — each routes to a page that names the reason as a licensing or billing limit, not a judgment, then lists 988, SAMHSA, FindTreatment.gov and Psychology Today. Texas patients blocked only by payer are offered direct-pay with the price shown.",
  },
  {
    h: "The app doesn't talk. You can.",
    p: "Read-aloud was built and then removed. Which voice a device offers ranges from warm to robotic with no way to guarantee which — a Linux machine has only eSpeak, hundreds of flat synthetic variants — and a machine voice reading intake questions to someone in a depressive episode is worse than silence. What survived is the half that works everywhere: a microphone on the free-text fields, where speaking genuinely is easier than typing. Choices are tapped, because tapping a chip was never the hard part.",
  },
  {
    h: "The microphone is only where typing is hard",
    p: "Two places: the \u201cwhat's been going on\u201d field and the chat composer. Both keep listening through a pause, so someone who stops to collect themselves isn't cut off mid-sentence. Names, dates and card numbers are typed — dictating a card number into a web page isn't something a product should invite.",
  },
  {
    h: "Two doors, one intake",
    p: "The form and Mira write to the same state — switch mid-flow and nothing is re-asked. Mira fills several slots from one sentence, so the conversational path is genuinely shorter, not just friendlier.",
  },
  {
    h: "One recommendation, one fast option",
    p: "Six provider cards is a decision a distressed patient can't make well. One Recommended card with the reasons it matched, one Soonest available, everything else behind Find more. Reasons are shown because an unexplained recommendation reads as an upsell.",
  },
  {
    h: "Safety runs underneath",
    p: "988 sits in a quiet strip on every screen. The symptom field and the chat both scan for self-harm language — including the curly apostrophe iOS inserts, which is how most phones actually type \u201cdon\u2019t\u201d. On a hit the chat stops asking intake questions, puts 988, 911 and the practice's own number on screen, and waits for the patient to say they're ready to continue. It never blocks the path to care, and the disclosure is kept verbatim so a nurse reads it before the visit.",
  },
  {
    h: "Only promise what the practice controls",
    p: "An earlier draft promised a callback \u201cwithin one business day.\u201d Disclosed on a Friday night that's 72 hours, and a concrete promise from us outcompetes the hotline sitting next to it. Now it says a nurse reads the intake before the visit, and gives a number to call — ours, plus 988.",
  },
  {
    h: "A badge that isn't true costs more than no badge",
    p: "\u201cSoonest available\u201d is only used when the second card really is sooner than the first. When the recommended provider already has the earliest opening, the second card is labelled on its real differentiator instead. Two badges that contradict the times underneath them teach a distressed patient to distrust everything on the screen.",
  },
  {
    h: "No countdown clock",
    p: "The hold used to tick down from 15:00, sticky to the bottom of the screen, right before a twelve-field form. For an anxious patient that turns a care decision into a timed test. The time is still held; it just says so calmly.",
  },
  {
    h: "The insurance question is answered, not asked",
    p: "1-Click Health discovery turns \u201cwhich plan do you have?\u201d into \u201cis this your plan?\u201d from a name and a birthday \u2014 and those two were needed for the chart anyway, so nothing is asked twice. Eligibility then replaces the invented copay range with a real number from the insurer, and catches the lapsed plan and the out-of-network plan before the patient discovers them in a bill. Medicare detection stops depending on a patient knowing that their Advantage plan is Medicare.",
  },
  {
    h: "Autofill never becomes a requirement",
    p: "Roughly one in five adults aren't found by discovery. \u201cEnter it myself\u201d is on screen throughout, not revealed after a failure, and the list of six carriers is one tap away. Same rule as the rest of the flow: the fast path is offered, never imposed.",
  },
  {
    h: "Money before the card",
    p: "$0 today, the expected copay, then the card. Surprise cost is the most common reason a booked psychiatric first visit never happens.",
  },
  {
    h: "Findable without shouting",
    p: "Search terms live where they don't cost the patient anything: the title tag, the meta description, MedicalBusiness structured data, the condition chips, and one keyword-carrying line under the headline. The footer states the practice, specialty, state and conditions in plain prose. No keyword-stuffed body copy.",
  },
];

export function DesignNotes({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  /* role="dialog" aria-modal needs the behaviour behind it: Escape to close,
     focus moved in, focus kept inside, focus returned on close. */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Why this flow is built this way">
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-xl2 border border-line bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] shadow-lift sm:rounded-xl2 sm:p-7 sm:pb-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Design notes</p>
            <h2 className="font-serif text-[1.4rem] leading-tight text-ink">Why this flow is built this way</h2>
          </div>
          <Button ref={closeBtn} variant="quiet" onClick={onClose} aria-label="Close design notes" className="!px-3">
            <Icon name="x" className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {NOTES.map((n) => (
            <Card key={n.h} className="p-5">
              <h3 className="font-medium text-ink">{n.h}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.p}</p>
            </Card>
          ))}
        </div>

        <p className="mt-5 text-xs text-faint">
          Prototype for design review. Fictional providers; no real accounts, appointments, or charges.
        </p>
      </div>
    </div>
  );
}
