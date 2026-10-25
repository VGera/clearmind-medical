"""Rebuild CONVERSATION.md from the Claude Code session log.

Run by hand, or from a Stop hook so the record stays current:
    python3 tools-make-transcript.py              # uses the default session
    python3 tools-make-transcript.py <log.jsonl>  # or an explicit log
    echo '{"transcript_path":"..."}' | python3 tools-make-transcript.py

Anything you write below the KEEP marker at the bottom of CONVERSATION.md is
preserved across regenerations — put your review notes there.
"""

import json, os, re, select, sys, datetime

DEFAULT_SRC = "/home/vijeta/.claude/projects/-home-vijeta/49c5e644-e34e-4250-9437-18d345634a2b.jsonl"
OUT = "/home/vijeta/clearmind-medical/CONVERSATION.md"
KEEP = "<!-- ===== Your notes below this line are preserved when this file is rebuilt ===== -->"


def resolve_src():
    """An explicit argument wins, then a hook's JSON on stdin, then the default."""
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        return sys.argv[1]
    # Only read stdin when something is actually waiting. isatty() alone hangs
    # when stdin is an open pipe with no data, which is how most shells invoke
    # this script.
    try:
        if not sys.stdin.isatty() and select.select([sys.stdin], [], [], 0.25)[0]:
            payload = json.load(sys.stdin)
            path = payload.get("transcript_path")
            if path and os.path.exists(path):
                return path
    except Exception:
        pass
    return DEFAULT_SRC


SRC = resolve_src()

# Pinned to the session that built this project. Run from a Stop hook, this
# exits quietly for any other session rather than overwriting the record with
# an unrelated conversation. Pass a log path explicitly to override.
EXPLICIT = len(sys.argv) > 1 and os.path.exists(sys.argv[1])
if not EXPLICIT and SRC != DEFAULT_SRC:
    sys.exit(0)

SESSION_DIR = SRC[:-6] if SRC.endswith(".jsonl") else SRC

AGENT_RE = re.compile(r'<agent-message from="([^"]*)">(.*?)</agent-message>', re.S)

def agent_report(text):
    """A delegated agent's report, which arrives in a user-role record."""
    m = AGENT_RE.search(text)
    if not m:
        return None
    body = m.group(2)
    body = body.split("The report follows:", 1)[-1]
    # The harness indents every line of a hand-back; undo that for readability.
    body = "\n".join(ln[2:] if ln.startswith("  ") else ln for ln in body.splitlines())
    return m.group(1), body.strip()


def clean_user(text):
    """Keep what the person actually wrote; drop harness scaffolding."""
    # Mid-turn interjection wrapper
    inter = "The user sent a new message while you were working:"
    if inter in text:
        text = text.split(inter, 1)[1]
        text = text.split("This is how Claude Code surfaces messages", 1)[0]
    # System reminders and command plumbing are not her words
    text = re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S)
    text = re.sub(r"<local-command-stdout>.*?</local-command-stdout>", "", text, flags=re.S)
    text = re.sub(r"<command-(name|message|args)>.*?</command-\1>", "", text, flags=re.S)
    # Pasted blocks are hers — unwrap, keep the content
    text = re.sub(r'<pasted_content id="[^"]*">', "", text)
    text = re.sub(r"</pasted_content id=\"[^\"]*\">", "", text)
    text = re.sub(r"</pasted_content>", "", text)
    return text.strip()

def ts(rec):
    t = rec.get("timestamp")
    if not t:
        return ""
    try:
        return datetime.datetime.fromisoformat(t.replace("Z", "+00:00")).astimezone().strftime("%b %d, %H:%M")
    except Exception:
        return t

SUBAGENT_LABELS = {
    "a9c3729c603cf2e7c": "Requirements & patient-tone review",
    "a36a883f77ef46134": "Mobile, accessibility & SEO review",
}
SUB_DIR = f"{SESSION_DIR}/subagents"


def subagent_reports():
    out = {}
    try:
        ids = [f[6:-6] for f in sorted(os.listdir(SUB_DIR)) if f.startswith("agent-") and f.endswith(".jsonl")]
    except OSError:
        ids = []
    for aid in ids:
        label = SUBAGENT_LABELS.get(aid, f"Delegated review ({aid[:8]})")
        best = None
        try:
            fh = open(f"{SUB_DIR}/agent-{aid}.jsonl")
        except OSError:
            continue
        with fh:
            for line in fh:
                try:
                    r = json.loads(line)
                except Exception:
                    continue
                if r.get("type") != "assistant":
                    continue
                c = (r.get("message") or {}).get("content")
                if not isinstance(c, list):
                    continue
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "SubagentHandback":
                        msg = (b.get("input") or {}).get("message", "")
                        if isinstance(msg, str) and (best is None or len(msg) > len(best[0])):
                            best = (msg, ts(r))
        if best:
            out[aid] = (label, best[0], best[1])
    return out


records = []
with open(SRC) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("type") in ("user", "assistant"):
            records.append(r)

turns = []          # [{"who","text","time","actions":[...]}]
pending_actions = []

for r in records:
    msg = r.get("message") or {}
    content = msg.get("content")
    if r["type"] == "user":
        if isinstance(content, str):
            if AGENT_RE.search(content):
                turns.append({"who": "agent-ref", "text": "", "time": ts(r), "actions": []})
                continue
            body = clean_user(content)
            if body:
                turns.append({"who": "user", "text": body, "time": ts(r), "actions": []})
        continue
    # assistant
    if not isinstance(content, list):
        continue
    for b in content:
        if not isinstance(b, dict):
            continue
        if b.get("type") == "tool_use":
            name = b.get("name", "tool")
            inp = b.get("input") or {}
            label = inp.get("description") or inp.get("file_path") or inp.get("skill") or inp.get("action") or ""
            pending_actions.append(f"{name}: {label}" if label else name)
        elif b.get("type") == "text":
            text = (b.get("text") or "").strip()
            if not text:
                continue
            turns.append({"who": "claude", "text": text, "time": ts(r), "actions": pending_actions[:]})
            pending_actions = []

if pending_actions and turns:
    turns[-1]["actions"].extend(pending_actions)

# ---- write ----
lines = []
A = lines.append
A("# ClearMind Medical — build conversation")
A("")
A("A record of the session that produced this prototype, for reviewing how the")
A("collaboration actually went.")
A("")
A("- **Your prompts are verbatim**, including pasted text (the paste wrappers are")
A("  stripped, the content is untouched).")
A("- **Claude's replies are verbatim** — the prose only.")
A("- **Not included:** Claude's internal reasoning, the full text of commands and")
A("  file edits, and tool output. Each reply lists the actions it took, collapsed,")
A("  so you can see *what* was done without wading through *how*.")
A("- Generated from the Claude Code session log")
A("  (`~/.claude/projects/-home-vijeta/49c5e644-….jsonl`). Edit freely — nothing")
A("  regenerates this file unless you ask.")
A("")
A(f"Session of {turns[0]['time'] if turns else ''} – {turns[-1]['time'] if turns else ''} · "
  f"{sum(1 for t in turns if t['who']=='user')} prompts · "
  f"{sum(1 for t in turns if t['who']=='claude')} replies · "
  f"{sum(1 for t in turns if t['who']=='agent')} delegated reviews")
A("")
A("## Where to look")
A("")
A("Pointers to the inflection points, by prompt number. Claude wrote these; they")
A("are its own read of the session, so treat them as a starting point to argue")
A("with, not findings. Delete this section if you'd rather start clean.")
A("")
A("**Turned out well**")
A("")
A("- **1** — the whole flow built in one pass, and the 8 specified phases were")
A("  collapsed to 6 screens with the reasoning stated rather than done silently.")
A("- **5** — two delegated reviews found real defects, including crisis detection")
A("  failing on the curly apostrophe iOS inserts by default. That one would have")
A("  shipped.")
A("- **10–13** — each reported bug was reproduced in a real browser before being")
A("  called fixed, and the fixes were verified the same way.")
A("")
A("**Did not go well**")
A("")
A("- **4 → 9: the voice feature.** Claude built read-aloud, then a warm-voice")
A("  scorer, then a voice picker across three rounds — and it was all removed at")
A("  **8–9**. The constraint that killed it (this machine has only eSpeak, which")
A("  cannot sound like a nurse) was discoverable on day one and was not raised")
A("  until **6**. Roughly three rounds of work thrown away.")
A("- **7: the error screen.** Two rounds to diagnose. The first answer blamed")
A("  stale JS chunks, which was a symptom; the actual cause was a one-year")
A("  `Cache-Control` on the HTML. The first fix could not have worked, because")
A("  `location.reload()` re-served the cached page.")
A("- **10: a self-inflicted regression.** Hardening `matchState` at **5** to stop")
A("  \"ok\" meaning Oklahoma also broke lowercase abbreviations, which is what")
A("  produced the coercive state question. The complaint traced back to Claude's")
A("  own earlier fix.")
A("- **Length.** Several replies were far longer than the decision in front of")
A("  them warranted.")
A("")
A("---")
A("")

n = 0
for t in turns:
    if t["who"] == "agent-ref":
        A(f"### ⟢ Delegated review reports arrive — {t['time']}")
        A("")
        A("*Two review agents report back. Their findings drove the next several")
        A("rounds of work; both are in the appendix at the end of this file.*")
        A("")
        A("---")
        A("")
        continue

    if t["who"] == "user":
        n += 1
        A(f"## {n}. Vijeta — {t['time']}")
        A("")
        for ln in t["text"].splitlines():
            A(f"> {ln}" if ln.strip() else ">")
        A("")
    else:
        A(f"**Claude** — {t['time']}")
        A("")
        A(t["text"])
        A("")
        if t["actions"]:
            uniq = []
            for a in t["actions"]:
                if a not in uniq:
                    uniq.append(a)
            A("<details>")
            A(f"<summary>Actions taken ({len(t['actions'])})</summary>")
            A("")
            for a in uniq:
                A(f"- {a}")
            A("")
            A("</details>")
            A("")
        A("---")
        A("")

reports = subagent_reports()
if reports:
    A("")
    A("## Appendix — the two delegated reviews")
    A("")
    A("Claude spawned two review agents against the build and applied their")
    A("findings. These are their reports in full, recovered from the agent logs.")
    A("They are **model output**, not Vijeta's words and not Claude's own replies.")
    A("")
    for aid, (label, body, when) in reports.items():
        A(f"### {label} — {when}")
        A("")
        A("<details>")
        A("<summary>Full report</summary>")
        A("")
        A(body)
        A("")
        A("</details>")
        A("")

kept = ""
if os.path.exists(OUT):
    with open(OUT) as f:
        existing = f.read()
    if KEEP in existing:
        kept = existing.split(KEEP, 1)[1]

A("")
A(KEEP)
if kept.strip():
    A(kept.rstrip())
else:
    A("")
    A("## My notes")
    A("")
    A("_(Anything you write here survives when the record is rebuilt.)_")

with open(OUT, "w") as f:
    f.write("\n".join(lines) + "\n")

print(f"wrote {OUT} — {sum(1 for t in turns if t['who']=='user')} prompts, "
      f"{sum(1 for t in turns if t['who']=='claude')} replies"
      + (", notes preserved" if kept.strip() else ""))
