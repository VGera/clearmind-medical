# Running and deploying ClearMind Medical

Moved out of the top-level README, which is now about the product decisions
rather than the mechanics.


Virtual psychiatry practice: **adults only, Texas only, no Medicare/Medicaid**.
Next.js prototype on **port 8101**.

```bash
npm run dev          # next dev -p 8101 -H 0.0.0.0
npm run build && npm start
systemctl --user restart clearmind-medical   # the unit that keeps it up
```
Local: http://localhost:8101 · LAN: http://<lan-ip>:8101 (substitute this machine's address)
From a phone: `sudo ufw allow 8101/tcp` first.

## The flow: 8 phases, 6 screens

| Phase (as specified) | Screen |
|---|---|
| 1. Start / acquisition | **Landing** |
| 2. Fit check + 4. Insurance | **Fit check** — state, age, carrier |
| 3. Conditions + 5. Needs | **Your care** — chips, free-text, needs |
| 6. Find match + reservation | **Your match** — recommended / soonest / find more + 15-min hold |
| 7. Patient details | **Your account** |
| 8. Payment | **Payment** → confirmation |

Insurance merges into the fit check because *which plan* is itself a fit
question. Conditions, the description, and what-kind-of-help are one thought, so
they're one screen. Three screens before anyone sees a provider.

## Designed for someone with no bandwidth

Patients using this may be depressed, anxious, or in crisis. So:

- One question per section, short labels, helper text only where its absence
  would cause a mistake.
- Progressive reveal — the next question appears when the last one is answered.
- Two headline provider cards, not six. Everything else behind **Find more**.
- Cost stated (**$0 today**) before the card fields.
- The two hard limits are on the landing page, before anyone invests effort.

## HTTPS (and therefore the microphone)

Browsers expose `navigator.mediaDevices` only on a **secure context** —
`https://` or `localhost`. Over `http://<lan-ip>:8101` the
`SpeechRecognition` constructor still exists but the microphone does not, so
the app checks `window.isSecureContext`, hides the mic, and says why.

A Caddy sidecar terminates TLS on **8443** and proxies to the app, which stays
on 8101:

```
https://<lan-ip>:8443      <- use this; microphone works
http://<lan-ip>:8101       <- still there; microphone hidden
```

```bash
systemctl --user status clearmind-https     # the sidecar
sudo ufw allow 8443/tcp                     # before testing from a phone
```

The certificate is self-signed and **not committed** — neither half of it is,
since a cert pins the addresses of one particular machine. Generate your own:

```bash
# add your LAN address as IP.2 in deploy/tls/san.cnf first
openssl req -x509 -newkey rsa:2048 -nodes -days 800 \
  -keyout deploy/tls/key.pem -out deploy/tls/cert.pem -config deploy/tls/san.cnf
```
Browsers will warn once — **Advanced → Proceed** — after which the origin is a
real secure context and the mic works. To silence the warning, trust
`deploy/tls/cert.pem` on the device: on macOS, drag it into Keychain Access
→ System and set it to *Always Trust*; on iOS, mail it to yourself, install
the profile, then enable it under Settings → General → About → Certificate
Trust Settings.

Regenerate it the same way if the LAN address changes.

## Voice: dictation only## Voice: dictation only

The microphone is for **typing free text**, in the two places where typing is
the hard part:

- the "what's been going on" field (`DictateTextarea`)
- the chat composer

Both keep listening through a pause (`continuous`), so someone who stops to
collect themselves isn't cut off. Names, dates and card numbers are typed.
`?novoice=1` disables the microphone entirely.

**The app does not speak.** Read-aloud was built and then removed: which voices
a device offers ranges from warm to robotic with no way to guarantee which — a
Linux box has only eSpeak, hundreds of flat synthetic variants — and a machine
voice reading intake questions to someone in a depressive episode is worse than
silence. Choices are tapped, not spoken; tapping a chip was never the hard part.

If a genuinely warm voice is wanted later, the honest route is a cloud voice
(OpenAI TTS `shimmer`/`nova`) behind an env var, not browser speech synthesis.

## Two doors, one intake

The form and the chatbot (**Mira**) write to the same state — switch mid-flow
and nothing is re-asked. Mira fills several slots from one sentence.

## Verified Inc. integration (mocked)

**1-Click Verify + 1-Click Health**, mocked in `src/lib/verified/` against the
documented response shapes, so the real SDK is a swap in `mock.ts` only.

**Insurance discovery** replaces the carrier guess. Three fields — first name,
last name, date of birth — return `payer.name`, `memberId`, `isMedicare` and
`coverageTypes`. Those same three fields go on the chart, so the details screen
is prefilled rather than asking twice. Manual entry sits beside it the whole
time: about one in five adults aren't found, so it's a path, not a failure.

**Real-time eligibility** replaces the invented "$25–$45". `benefits[]` gives
`copay`, `deductible` (with `remaining`) and `coinsurance`; `network.status`
gives in/out-of-network; `coverageStatus` catches a lapsed plan. The payment
screen states a real number and says it isn't an estimate.

**Exclusions become data.** `isMedicare` and a Medicaid payer-name match route
to the resources page instead of relying on self-report — Medicare Advantage
often reads as commercial to a patient. Texas patients blocked only by payer
still get the direct-pay offer.

**1-Click Verify** replaces the OTP step with the documented waterfall:
autofill (carrier returns the number, nothing typed) → silent (typed number
confirmed without an SMS) → SMS code. All three render; none is treated as the
real one, and the code path is always reachable.

Test users are keyed on last name + date of birth — see the header comment in
`src/lib/verified/mock.ts` for the full list (BCBS, UHC, Aetna, a two-plan
Cigna/Oscar case, Medicare Advantage, Medicaid STAR, an inactive plan, and
anything else for the not-found path).

Not wired, and needed for production: a Verified account and API keys, the
practice NPI (eligibility is submitted as the provider), a HIPAA BAA, and a
check that all five payers support eligibility checks in Texas.

## Off-ramps (never a dead end)

Out of state, under 18, Medicare, or Medicaid routes to `CareElsewhere`, which
names the reason as a licensing or billing limit rather than a judgment, then
lists **988**, the **SAMHSA National Helpline** (1-800-662-4357),
**FindTreatment.gov**, and the **Psychology Today** directory — plus pediatric
routing for minors and a "tell me when you open here" capture for out-of-state.

Texas patients blocked only by payer are offered direct-pay with the price shown
($249 intake / $129 follow-up) alongside the covered options.

## Safety

988 sits in a quiet strip on every screen. The symptom field and the chat both
scan for self-harm language (`detectCrisis`) — including the curly apostrophe
iOS substitutes, which is how most phones actually type "don't".

On a hit the chat **stops asking intake questions**, puts 988, 911 and the
practice's own number on screen, and waits for an explicit "I'm okay to keep
going". The disclosure is kept verbatim in `symptoms` regardless of which
question was being asked, and `crisisDisclosed` carries it to the confirmation
screen. It never blocks the path to care.

The practice only promises what it controls: a nurse reads the intake before the
visit, and there's a number to call. No "within one business day".

## Found on the web

Search terms live where they cost the patient nothing: the title tag, meta
description, `MedicalBusiness` JSON-LD, the condition chips, one keyword-bearing
line under the headline, and a plain-prose footer naming the practice,
specialty, state, and conditions. No keyword-stuffed body copy.

## Code map

```
src/lib/types.ts    intake state, blocker rules
src/lib/data.ts     QUESTIONS (on screen) + SPOKEN (voice), options, providers, resources
src/lib/parse.ts    spoken/typed answer matching, crisis detection, dictation cleanup
src/lib/match.ts    provider scoring; recommended / soonest / rest
src/lib/voice.tsx   Web Speech provider, warm-voice selection, useAutoRead
src/components/     Shell, VoiceBits, Chat, CareElsewhere, DesignNotes, ui
src/components/steps/  Landing, FitCheck, Care, Match, Account, Payment, Done
```

`Design notes (for reviewers)` in the footer opens the design-rationale panel.

## Deploying over an open tab

Next serves a statically prerendered page with `s-maxage=31536000,
stale-while-revalidate` by default. Every `next build` gives the JS chunks new
hashed filenames, so a browser holding that cached document asks for files the
new build deleted — a client-side exception that an ordinary reload cannot fix,
because the reload re-serves the same cached HTML.

`next.config.js` now sends `no-store` for the document (hashed assets under
`/_next/static` keep their immutable caching), and `src/app/error.tsx` recovers
by reloading once with a cache-busting query param rather than
`location.reload()`. The error screen keeps 988 and the practice number visible
and shows the real message under "Technical detail" — an error page is still a
care surface for this audience.

## Reviewed

Two critique passes (clinical/requirements, and mobile/a11y/SEO) ran against
this build; their findings are applied. Notable ones worth knowing about:

- `detectCrisis` failed on smart apostrophes — i.e. on most phones. Fixed and
  verified against real phrasings.
- A disclosure bundled with a condition word ("I'm depressed and I want to die")
  was being dropped from the record entirely.
- Read-aloud cancelled each line of a chat turn after ~1.5s, truncating crisis
  replies mid-word. Utterances now queue.
- "I'm not 18" read as *yes* on the voice path. Negated and approximate ages now
  re-ask instead.
- Auto-read only spoke the first question on each screen; it now follows the
  question that's live.
- `text-faint` (#8a979f) failed WCAG AA at every size it was used, including
  "We can't bill Medicare" and the 988 qualifier. Collapsed into `muted`.

**Known gap:** there is one route. Condition and insurance landing pages
(`/adhd`, `/insurance/blue-cross-blue-shield`, `/providers/[id]`) are where
search traffic for a single-state practice actually lives, and they don't exist
yet. The funnel copy shouldn't absorb that job — see the design notes.

Fictional providers. No real accounts, appointments, or charges.
