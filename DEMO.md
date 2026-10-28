# ClearMind Medical — demo script

**Target: 4 min 45 s.** Written to be read aloud. `[SAY]` is roughly what you
say; `[DO]` is what you click. Timings are cumulative, so you can see at a
glance whether you're running long.

Everything below is a prototype. The funnel figures are from the
instrumentation summary supplied with the assignment, and they are **session
rates, not patient rates** — the script says so in one clause so nobody has to
ask. The deeper analysis, including the leverage maths and the measurement
gaps, is in `FUNNEL.md`; keep it open in a tab for Q&A.

---

## Prep (2 minutes, before anyone joins)

1. **Window width ~400px.** Run the whole demo in a narrow Chrome window.
   Mobile-responsive is a design decision you made, and the honest way to show
   it is to never leave the phone layout. Don't toggle device mode mid-demo.
2. **Three tabs, in this order:**
   - Tab 1 — `http://localhost:8101/` (landing, the main path)
   - Tab 2 — `http://localhost:8101/portal`, **already signed in** (phone
     `(512) 555-0134`, then the code the screen shows you). Signing in live
     costs 20 seconds you don't have.
   - Tab 3 — `http://localhost:8101/` sitting on the fit check, nothing
     answered. This is the off-ramp tab.
3. **Have the lookup identity on a sticky note:** `Ada` / `Lovelace` /
   `1990-05-05`. Typing a wrong DOB kills that beat.
4. If you want to demo the **microphone or the video visit**, use
   `https://<your-ip>:8443` — both need a secure context, and you'll have to
   accept the self-signed cert once. Over plain http the app says why the
   camera can't open rather than failing silently. Otherwise skip it and just
   say the line.

---

## 0:00 — 0:45 · Start with the funnel, including where I was wrong

**[DO]** Tab 1, landing page. Don't scroll. Don't click anything yet.

> **[SAY]** "Patient onboarding for a virtual psychiatry practice — adults,
> Texas only, no Medicare or Medicaid.
>
> I started with the funnel. **5,898 sessions start, 1,403 reach the payment
> page — 23.8%.** Sessions, not patients, which matters and I'll come back to
> it. Of the 4,495 sessions lost, **two steps account for two-thirds.**
>
> The steepest is **provider selection**: 3,013 people reach the match page,
> and **1,104 of them never pick anyone — 36.6%.** The page isn't hard to get
> to. It's hard to act on.
>
> The largest is the **fit check** — **1,912 sessions, 42.5% of all loss.** And
> I'll be straight with you: I didn't expect that one. I came in assuming
> provider selection and account creation. Provider selection was right.
> Account creation is real but smaller — 8% of total loss. The fit check is
> bigger than both, and I'd missed it.
>
> But here's the thing that actually changed what I built: **there is no
> fit-submit event.** That page has a page-view and nothing else. So for those
> 1,912 sessions you cannot tell an Oklahoma resident who was **correctly
> screened out** from a Texan who was eligible and just left. **The biggest
> number in this funnel is unattributable.**
>
> So I did two different things. Where the cause is knowable, I redesigned.
> Where it isn't, I instrumented it and designed for the most likely
> explanation. And I built all of it at this width — phone-first was the
> starting point, not a port."

**Decisions on the record:** redesign where the cause is knowable; instrument
before redesigning where it isn't; mobile-responsive as the starting width.

---

## 0:45 — 1:20 · Fit check, and the Verified decision

**[DO]** Click **Start**. Pick **Texas** → **Yes, 18 or older**.

> **[SAY]** "Five steps, and the header always says which one you're on. These
> patients are often anxious or ADHD — not knowing how much is left is its own
> reason to quit."

**[DO]** At the insurance question, click **Look it up for me**. Type `Ada`,
`Lovelace`, `1990-05-05`.

> **[SAY]** "This is where I made an integration call. I looked at Verified's
> three products — 1-Click Verify, 1-Click Signup and 1-Click Health. Verify
> and Signup confirm a real identity, which we need. But 1-Click Health is the
> only one that also does **insurance discovery and real-time eligibility**, so
> it does identity *and* answers 'am I covered and what will this cost'. That's
> the question that actually makes people abandon. So: 1-Click Health, mocked
> here against their documented field shapes.
>
> And notice what just happened — they typed their name once. They won't type
> it again."

**Decision on the record:** chose 1-Click Health over Verify/Signup because it
collapses identity + coverage + cost into one ask. Mocked, not wired.

---

## 1:20 — 2:00 · What's going on

**[DO]** Tap three or four condition chips. Then the free-text box.

> **[SAY]** "Chips, not a form. Short taps are the default, and there is exactly
> one longer question — and it's optional. Nothing here is required, and nothing
> loops back to nag you. If you skip a question, the flow accepts the answer and
> moves on. For a neurodiverse patient, a screen that won't let you past is the
> moment you close the tab."

**[DO]** Point at the microphone icon in the free-text field.

> **[SAY]** "The one place people have to write, they can talk instead. I
> deliberately did *not* add speech output — a site that talks at you is
> patronising. Dictation in, nothing out."

**[DO]** Point at the crisis strip pinned at the top.

> **[SAY]** "988 is on every screen, and it never blocks the flow. If someone
> types something that sounds like a crisis, we surface help and **keep their
> appointment moving** — we don't throw them out of the funnel to prove we took
> it seriously."

**Decision on the record:** never force an answer; dictation only, no TTS;
crisis support is additive, never a gate.

---

## 2:00 — 2:40 · Choose a provider — the 1,104

**[DO]** Continue to the match screen.

> **[SAY]** "This is the 1,104. Highest value per point in the whole funnel —
> a point recovered here is worth 22 extra payment-page reaches, because 73.5%
> of people who select a provider make it all the way through.
>
> So: not a directory — **two cards.** One recommended, scored against what
> they just told us, and one that's the soonest available. Everything else is
> behind **Find more**, for the people who want it.
>
> Each card is two or three bullets and a time. The clinician's longer bio is behind
> **About** — because six lines of prose at the exact moment you're trying to
> choose is how you get a decision deferred."

**[DO]** Tap a time. Point at the hold bar.

> **[SAY]** "Tapping a time holds it — before any account exists. That's
> straight out of the data: once someone holds a slot, **reservation to patient
> details is 99.9%. One session lost out of 1,764.** It's the strongest signal
> in the whole dataset. So the hold goes as early as possible."

**[DO]** Click **Find more** for two seconds, then collapse it.

**Decision on the record:** two ranked cards + progressive disclosure, and the
slot is held before any account exists.

---

## 2:40 — 3:10 · Details and payment — the 360

**[DO]** Continue. Scroll the details screen.

> **[SAY]** "360 sessions die here — 20.4%. And it's the cheapest gate in the
> funnel to fix, because account creation to payment page is **100.0% with zero
> drop.** Every point I win here converts one-for-one.
>
> Look at what's already filled in — name and date
> of birth came from the insurance lookup. We ask for email, mobile, and two
> consents. **No password.** Phone verification is folded into this same screen
> rather than being its own step, and we say why: so appointment reminders
> reach you.
>
> What we don't ask for here is address, pharmacy, emergency contact and
> history. That's a form we email after they book. None of it is needed to
> hold a visit, and every field we add here is a field someone quits on."

**[DO]** Enter the code the screen shows. Continue to Payment.

> **[SAY]** "This figure is their actual copay — it came back from the
> eligibility check, not an estimate.
>
> And **nothing is charged today.** That's deliberate. The current funnel has
> no payment-success event, so 1,403 reach this page and the data just stops —
> the true conversion is unknown and at most 23.8%. If I bill after the visit
> instead, finishing onboarding no longer depends on a charge succeeding, and
> that dark endpoint stops being a gate."

**Decision on the record:** no password; verification folded in rather than
appended; clinical intake deferred to post-booking email.

---

## 3:10 — 3:55 · The portal — one place to get help

**[DO]** Switch to Tab 2 (already signed in).

> **[SAY]** "Onboarding isn't finished when they pay — it's finished when
> they've been seen. So the second half of this is a returning-patient portal:
> one place to get help from a ClearMind provider instead of calling the
> office."

**[DO]** Visits tab. Point at the two upcoming visits — one tomorrow, one
starting now with a live **Join** button — then the past visit's summary.

> **[SAY]** "Upcoming and past visits, the join link, and the after-visit
> summary — what was agreed and what happens next. The clinical note is
> deliberately **not** in there. For psychiatric patients that's sensitive, and
> we say so on the screen instead of silently omitting it."

**[DO]** Click **Reschedule**, then **See other providers**.

> **[SAY]** "Rescheduling is the pressure valve on the cancel button — most
> people who cancel only have a problem with the time. And if they want a
> different clinician, they get the same two-card pattern as booking:
> recommended, soonest, Find more. The important part — **their existing
> appointment stays booked** until they confirm a new one. Every screen says so."

**[DO]** Back out with **Keep my current time**. Show Messages, then Medications.

> **[SAY]** "Messaging is asynchronous with a stated promise — one business
> day. Refill requests go through here, which is why there's no separate
> refill button: a controlled substance can't be re-sent by tapping a button,
> and a button that fails silently is worse than no button. Medications show
> status only."

**Decision on the record:** portal is scoped to what a patient actually does
between visits; clinical note withheld on purpose; one messaging channel
rather than a button per intent.

---

## 3:55 — 4:20 · The off-ramp — the 1,912

**[DO]** Switch to Tab 3. Pick a state that isn't Texas.

> **[SAY]** "Last thing, and it's the one I care most about — and the funnel is
> why. Remember the 1,912 at the fit check. For a Texas-only, adults-only
> practice that can't bill Medicare or Medicaid, a large share of those people
> were **correctly** turned away. Which means this screen may be one of the
> highest-volume screens in the entire product — and today it does nothing for
> anybody.
>
> The default is a dead end: 'we can't help you.' Someone reaching out about
> their mental health and getting that is a real harm.
>
> So out-of-state, under-18, and Medicare or Medicaid all land **here**: named
> resources, 988, the SAMHSA helpline, FindTreatment.gov, Psychology Today. We tell them more states are
> coming. Nobody leaves with nothing."

**Decision on the record:** every exclusion has a staffed exit, not an error
message.

---

## 4:20 — 4:45 · Close on the measurement plan

> **[SAY]** "So: eight phases over eight URLs became five steps. Two-card
> selection against the 36.6%. Prefill and no password against the 20.4%.
> 1-Click Health because coverage and cost are the real objection. Off-ramps
> because a big piece of the biggest leak is people we were never going to
> serve. On stated assumptions that's roughly **+34% relative — 23.8% to about
> 32%** — and I deliberately left the fit check alone, because I don't yet know
> how much of it is recoverable.
>
> Which is the actual first thing I'd ship: **a fit-submit event with the
> reason** — eligible, out-of-state, under-18, excluded payer, abandoned. Until
> that exists, 42.5% of all loss is uninterpretable. Then a payment-success
> event so the funnel ends at an outcome, a visit-attended event because that's
> the real definition of onboarded, patient-level stitching so deliberation
> stops looking like abandonment, and one event on **Find more** — which tells
> me directly whether two cards was the right call."

---

## If you have 90 more seconds

In priority order:

1. **The chat path.** On the fit check, switch to chat and answer two questions
   in plain sentences. Then switch back to the form — the answers are still
   there. *"Same funnel, two front doors, one state."* (~40 s)
2. **The video visit.** The portal holds a visit that starts now, so
   **Join your visit** is live on the second card. Real camera and mic, a level
   meter so they can see their voice registers, and every track is released
   when you leave. Needs `https://<your-ip>:8443` — the camera won't open over
   plain http. (~30 s)

   If you want the failure case: block the camera for the site and rejoin. The
   visit continues by voice, and says so, rather than claiming both devices are
   blocked.
3. **The care plan.** First visit → Follow-up → Follow-up → 90-day review, with
   visits planned and completed. *"Simple progress, no points or streaks —
   gamifying medication adherence would be the wrong instinct here."* (~20 s)

## Hard cut list, if you're past 2:40 at the details screen

Cut in this order, no hesitation:
- The `Find more` expansion at 2:30 (just say it exists)
- Medications at 3:50
- The microphone line at 1:50
- The whole off-ramp beat — but then add one sentence to the close:
  *"and everyone we can't see gets named resources rather than a dead end."*

## Questions you'll get, with short answers

**"Is Verified actually integrated?"**
No — mocked against their documented field shapes, so swapping in the real API
is a client change, not a redesign. I did the product evaluation, not the wiring.

**"Why no password?"**
WCAG 2.2 added accessible authentication for a reason. Phone code for a new
patient, phone code or email link for a returning one. One less thing to fail
at.

**"Why didn't you fix the fit check, if it's the biggest leak?"**
Because I can't tell yet how much of it *is* a leak. There's no fit-submit
event, so a correctly-excluded Oklahoma resident and an abandoning Texan look
identical. Redesigning against an unattributable number is guessing. I
instrumented it and, in the meantime, designed for the most likely
explanation — that a lot of those people are legitimately ineligible — which is
what the off-ramp is for.

**"Isn't 36.6% at provider selection partly people coming back later?"**
Yes, and I'd treat it as an upper bound. These are sessions, not patients, and
choosing a psychiatrist is exactly the decision someone sleeps on, so
deliberation reads as abandonment. It doesn't change the conclusion — if people
leave to think and return, that's still a decision-support failure — but I
wouldn't quote 36.6% as the number who gave up. Patient-level stitching is
fourth on my instrumentation list for that reason.

**"You moved insurance earlier, into the fit check. Isn't that riskier?"**
It's the one place I added load to the step with the biggest drop, so it's the
change I'd watch hardest. The reason is that coverage and cost are the real
objection, and finding out at step 4 that we can't bill your plan wastes
everyone's time — including the patient's. The fit check is also one scrolling
screen with progressive reveal, not three page loads, and the three page hops
it replaces were costing 6.9%, 6.7% and 7.3% to navigation alone.

**"How much is this worth?"**
On stated assumptions, about +34% relative — 23.8% to roughly 32%. That's
arithmetic to size the bet, not a forecast, and it deliberately assumes zero
recovery at the fit check. The workings are in `FUNNEL.md`.

**"Why only two providers shown?"**
Because choice overload is the failure mode, and these patients are the least
equipped population to absorb it. `Find more` is there for people who want the
list. Whether two is the right number is measurable, and I'd measure it.

**"What about the clinical intake you deferred?"**
Address, pharmacy, history and emergency contact aren't needed to hold a visit.
They go out as an emailed form after booking, which also means a partially
completed one doesn't cost us the appointment.
