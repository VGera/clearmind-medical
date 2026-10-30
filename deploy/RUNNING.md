# Running and deploying

Operational notes. The product reasoning is in the top-level README.

## Run it

```bash
npm run dev                                  # next dev -p 8101 -H 0.0.0.0
npm run build && npm start
systemctl --user restart clearmind-medical   # the unit that keeps it up
```

`http://localhost:8101`. From a phone on the same network, use this machine's
address and open the port first: `sudo ufw allow 8101/tcp`.

## HTTPS, and therefore the microphone

Browsers expose `navigator.mediaDevices` only on a **secure context** —
`https://` or `localhost`. Over plain HTTP to a LAN address the
`SpeechRecognition` constructor still exists but the microphone does not, so
the app checks `window.isSecureContext`, hides the mic, and says why.

A Caddy sidecar terminates TLS on **8443** and proxies to the app on 8101:

```bash
systemctl --user status clearmind-https
sudo ufw allow 8443/tcp                      # before testing from a phone
```

The certificate is **not committed** — neither half, since a cert pins the
addresses of one particular machine. Generate your own:

```bash
# add this machine's LAN address as IP.2 in deploy/tls/san.cnf first
openssl req -x509 -newkey rsa:2048 -nodes -days 800 \
  -keyout deploy/tls/key.pem -out deploy/tls/cert.pem -config deploy/tls/san.cnf
```

Browsers warn once — **Advanced → Proceed** — after which the origin is a real
secure context. To silence the warning, trust `deploy/tls/cert.pem` on the
device: on macOS drag it into Keychain Access → System and set *Always Trust*;
on iOS mail it to yourself, install the profile, then enable it under
Settings → General → About → Certificate Trust Settings.

## Deploying behind another site

The app can serve from a sub-path of an existing site as well as from its own
root. The prefix is baked in **at build time**, because Next writes its asset
URLs during the build — it cannot be switched at runtime.

```bash
REMOTE_HOST=<host> bash deploy/ship-clearmind.sh
```

That builds with the prefix, checks the sub-path serves with prefixed assets,
and only then transfers the image to the host. Then apply the routing from the
site's own repo.

Three things that will bite:

- Proxy with a rule that **preserves** the prefix. Stripping it (Caddy's
  `handle_path`, nginx's trailing-slash `proxy_pass`) 404s every script and
  stylesheet, because the app emits its own URLs under the prefix.
- A restrictive `Permissions-Policy` on the parent site will disable the
  microphone and camera. This app is a telehealth flow built around both, so
  that header needs relaxing for the sub-path.
- Caddy does not reload a changed Caddyfile on a config-only deploy. Restart
  the proxy container after editing routes.

## Who has opened it

When the app is served under a sub-path of a site that already runs the
visitor-stats sidecar, a second instance of that sidecar covers this app alone:
same script, with `ONLY_PREFIX` set to the sub-path so it counts only this
app's own traffic, writing to its own report directory.

The dashboard sits one level under the app's own path and is matched on the
longer path, declared ahead of the app's route, so the app never receives those
requests. It uses a **different credential from the app's shared password** —
the owner's existing stats login — so handing the prototype to someone does not
hand them the list of who else has seen it.

Visits are sessions, not hits: assets, bot traffic and the owner's own IPs are
filtered out, and a 30-minute idle gap starts a new session. The report
regenerates about once a minute.

## Test fixtures

Identity, insurance discovery and eligibility are mocked in `src/lib/verified/`
against the documented response shapes, so swapping in the real SDK is a change
in `mock.ts` only.

Discovery takes first name, last name and date of birth, and returns a payer, a
member ID and coverage flags. Those same three fields go on the chart, so the
details screen arrives prefilled. Manual entry sits beside it throughout —
about one in five adults aren't found, so it's a path rather than a failure.

Eligibility returns real copay, deductible and network status, which is why the
payment screen can state a figure and say it isn't an estimate.

Test users are keyed on **last name + date of birth** — the header comment in
`src/lib/verified/mock.ts` lists them all, covering a clean match, an unmet
deductible, out-of-network, two plans found, excluded payers, an inactive plan,
and anything else for the not-found path.

Phone verification renders all three documented channels (autofill, silent,
SMS code); the code path is always reachable.

Needed before this is real: a Verified account and API keys, the practice NPI
(eligibility is submitted as the provider), a HIPAA BAA, and confirmation that
each payer supports eligibility checks in the practice's state.

## Code map

```
src/lib/types.ts              intake state, blocker rules
src/lib/data.ts               questions, options, providers, care plan, resources
src/lib/parse.ts              answer matching, crisis detection, dictation cleanup
src/lib/match.ts              provider scoring; recommended / soonest / rest
src/lib/paths.ts              base-path prefix for plain anchors
src/lib/voice.tsx             dictation only — SpeechRecognition, no speech output
src/lib/verified/             identity, discovery and eligibility mocks
src/lib/portal/               portal fixtures
src/components/steps/         Landing, FitCheck, Care, Match, Account, Verify, Payment, Done
src/components/portal/        Login, Visits, VideoVisit, Reschedule, Messages, Prescriptions
src/components/               Shell, Chat, InsuranceAutofill, CarePlan, CareElsewhere, ui
```

*Design notes (for reviewers)* in the footer opens the rationale panel.

## Deploying over an open tab

Next serves a statically prerendered page with a year-long cache by default,
and every build gives the JS chunks new hashed filenames. A browser holding the
old document then asks for files the new build deleted — a client-side
exception that an ordinary reload cannot fix, because the reload re-serves the
same cached HTML.

`next.config.js` sends `no-store` for the document while hashed assets keep
their immutable caching, and `src/app/error.tsx` recovers by reloading once
with a cache-busting query rather than `location.reload()`. The error screen
keeps the crisis line and the practice number visible — an error page is still
a care surface for this audience.

## The build record

`tools-make-transcript.py` rebuilds `CONVERSATION.md` from the session log, and
`tools-redact-transcript.py` produces the committed `TRANSCRIPT.md` from it.
The second reads its rules from a local `.identity` file that is deliberately
not committed, and refuses to run without it rather than writing an unredacted
record.
