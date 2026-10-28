# ClearMind Medical

Patient onboarding for a virtual psychiatry practice — adults, Texas only, and
unable to bill Medicare or Medicaid.

A working prototype of the whole journey: finding out whether the practice can
see you, saying what's going on, choosing a clinician, booking, paying, and then
the returning-patient portal where the care actually happens.

---

## What the funnel said

The redesign started from the practice's own instrumentation rather than from
taste. Of every hundred people who begin, fewer than twenty-four reach the
payment page — and **two steps account for two-thirds of everyone lost**.

The steepest is **choosing a clinician**. Almost everyone who finishes the
earlier questions arrives at the provider page; more than a third of them then
pick nobody. The page isn't hard to reach. It's hard to act on.

The largest is the **fit check**, the very first question. It loses more people
than any other step in the funnel.

**I had assumed the problems were provider selection and account creation.**
Provider selection was right, and it's the steepest rate in the whole funnel.
Account creation is real but far smaller than I thought — worth fixing, not the
headline. The fit check, which I hadn't suspected at all, is bigger than both of
my guesses combined.

## The most important finding isn't a conversion number

**There is no event recording what someone answered at the fit check** — only
that the page was seen. So for the single largest drop in the funnel, it is
impossible to tell apart:

- someone out of state who was **correctly** turned away — a success for the
  practice, and a person who still needs care; from
- someone eligible who simply left.

The biggest number in the funnel is unattributable. For a practice restricted to
one state, to adults, and to commercial insurance, a large share of that loss
is almost certainly people it was never able to serve — which means a big part
of the "biggest leak" isn't a leak, and the headline conversion rate is measured
against a denominator full of people who were never addressable.

Two more gaps sit at the other end: nothing records a **successful payment**,
and nothing records that a patient was **actually seen**. The funnel's reported
finish line is not an outcome.

That split the strategy, and it's the thing I'd most want to be judged on:
**redesign where the cause is knowable, instrument first where it isn't.**
Per recovered percentage point the three main gates are worth about the same, so
the ordering comes from how well each cause is understood, not from the size of
each drop.

## Two findings that decided the design on their own

**Holding a time works.** Once someone has reserved a slot, essentially nobody
is lost before the details screen — one session in well over a thousand. It is
the strongest single signal in the data, and it says the reservation is doing
real commitment work. So the time is held **before any account exists**.

**Account creation is the last real gate.** Everyone who creates an account
reaches the payment page; there is nothing between the two to fix. That makes it
the cheapest place to win, because every point recovered converts one for one.

---

## The decisions

**Eight phases became five steps.** Three of the old page-to-page hops were
losing people to navigation alone, before anyone had been asked anything
difficult.

**Two clinicians, not a directory.** One recommended against what the patient
just said, one who can see them soonest, and everyone else behind *Find more*.
Each card is a few lines; the longer biography sits behind *About*, because six
paragraphs of prose at the exact moment of choosing is how a decision gets
deferred. These patients are the least equipped population to absorb choice
overload.

**Nothing is ever forced.** Every question can be skipped or answered badly, and
the flow accepts it and moves on. No question loops. For someone anxious or
easily derailed, a screen that won't let you past is the moment the tab closes.

**No password.** A code to your phone for a new patient, a code or an emailed
link for a returning one. One less thing to fail at, and the right default for
an audience with memory and attention difficulties.

**The clinical intake comes later.** Address, pharmacy, history and emergency
contact aren't needed to hold an appointment, so they arrive by email after
booking. A half-finished form then costs a form, not the appointment.

**Insurance is answered by lookup, not from the card.** Coverage and cost are
the real objection, so the flow resolves the plan and shows a genuine copay
rather than an estimate. The identity typed once is reused, so the details
screen arrives already filled in.

**Nothing is charged during onboarding.** The card is kept and billed after the
visit. Since the funnel has no payment-success event, a charge is a dark spot in
the data; decoupling it removes the dark spot as a gate.

**Crisis support is additive and never a gate.** Help is on every screen, and
disclosing something frightening never blocks, flags or reroutes the
appointment. What the patient wrote is kept, and they are thanked for it.

**Dictation in, nothing spoken out.** A microphone where someone has to write
prose. No synthesised voice — a site that talks at you is patronising.

**Every exclusion has a staffed exit.** Out of state, under 18, Medicare,
Medicaid: all land on named, working resources rather than an error. Where the
practice genuinely can still help by other means, that route is offered on the
same screen as the bad news, not hidden behind the way out.

**Onboarding ends at the first visit, not at the payment.** Hence the portal:
upcoming and past visits, joining, moving or cancelling an appointment,
messaging, medications, and a visible plan for the first ninety days.

**Moving an appointment is the pressure valve on cancelling**, since most people
who cancel only have a problem with the time. The existing appointment is held
until a new one is confirmed — including when the patient wants a different
clinician, which gets the same two-card treatment as booking.

---

## The trade-offs

**Insurance was moved earlier, into the step with the biggest drop.** This is
the one place where load was added to the weakest point in the funnel, and it's
the change I'd watch hardest. The reasoning: finding out at step four that the
practice can't bill your plan wastes everyone's time, the patient's most of all.
It also replaces three page loads with one screen that reveals itself as you go.

**Two recommendations instead of the full list.** Choice overload is the failure
mode being addressed, but some people genuinely want to compare everyone, and
for them an extra tap is a cost. Whether two is the right number is measurable,
and it's the main risk in the redesign.

**The fit check was deliberately left alone**, despite being the largest loss.
Redesigning against a number nobody can interpret is guessing. It was
instrumented instead, and in the meantime designed for the most likely
explanation — that many of those people are legitimately ineligible — which is
what the resources page is for.

**The after-visit summary leaves out the clinician's own notes.** For
psychiatric care that is a deliberate protection rather than an omission, so the
screen says so plainly and explains how to get them, rather than quietly
withholding.

**One messaging channel rather than a button per task.** Refills go through the
conversation, because a controlled medication can't be reissued by tapping a
button and a button that silently fails is worse than no button. The cost is
that the patient has to write a sentence.

**Patients who can't be billed are still offered a direct-pay route** — and told
to go and check whether a covered option costs less. That sentence loses the
practice some revenue. It buys more trust than it costs.

**Identity and eligibility are simulated, not connected.** The product
evaluation was the deliverable: of the three available products, the one chosen
is the only one that answers identity *and* coverage *and* cost in a single ask,
because cost is the real objection. Swapping the simulation for the live service
is a plumbing change, not a redesign.

---

## What I'd instrument first

1. **What the fit check was answered with, and why someone stopped** —
   eligible, out of state, under 18, excluded payer, abandoned. Until this
   exists, the largest share of all loss cannot be interpreted, and nobody can
   say whether the biggest number in the funnel is a problem or a filter working
   correctly.
2. **A successful payment**, so the funnel ends at an outcome instead of a page.
3. **A visit actually attended** — the real definition of an onboarded patient.
4. **Patient-level identity**, so someone deliberating across several visits
   stops looking like someone who gave up.
5. **Whether anyone opens *Find more***, which answers the one open question in
   this redesign directly.

Sized on stated assumptions, the changes here are worth roughly a third more
patients reaching the end — while assuming **zero** recovery at the fit check,
because that part isn't yet understood. That figure is arithmetic to size the
bet, not a forecast.

---

## Reading the numbers honestly

The source data counts **sessions, not people**. Repeat visits, blocked
analytics and continuing on another device all inflate the denominators.

Provider selection is the step most exposed to this, because choosing a
psychiatrist is exactly the decision someone sleeps on. Its drop should be read
as an upper bound on real abandonment. That doesn't weaken the conclusion — if
people leave to think and come back, it's still a decision-support failure — but
it isn't the number of people who gave up.

---

## Status

A prototype. The clinicians, appointments, medications, messages and reviews are
fictional, and the sample reviews are labelled as such on the page. Identity,
insurance and payment are simulated. Nothing here is a medical device, and
nothing in it constitutes medical advice.
