#!/usr/bin/env python3
"""Build TRANSCRIPT.md from CONVERSATION.md, minus the things that should not
leave this machine.

CONVERSATION.md is the full local record. This produces the copy you can hand
to someone else: the collaboration is intact, but the assignment's own data,
personal identifiers and references to unrelated work are gone.

Run it after CONVERSATION.md is rebuilt. Asserts on every removal, so a change
to the source that breaks a rule fails loudly instead of silently publishing.
"""
import os
import re
import sys

SRC = "CONVERSATION.md"
OUT = "TRANSCRIPT.md"
HERE = os.path.dirname(os.path.abspath(__file__))

NOTE = """> **Note on this record.** This is the build conversation with the
> assignment's own funnel data removed — that table was supplied to me in
> confidence and isn't mine to pass on. Personal contact details, local
> network addresses and references to unrelated projects are also stripped.
> Everything about *this* project is unedited, including the places I got
> things wrong and had to back them out.
>
> One exchange is worth reading in full rather than in isolation: at
> "Check Legion Health website and add some patients testimonies or make it
> up", the testimonials that resulted are original copy written in that
> format, not reused, and they are labelled on the page itself as
> "Sample reviews for this prototype — written for the demo, not real
> patients". Real reviews would need written patient authorisation.
"""


def drop_quoted_block(lines, start_pat, replacement):
    """Remove a pasted block entirely: from the first line matching start_pat
    through the last consecutive quoted line of that same message.

    Matching on an end *pattern* was the wrong shape — the first candidate
    string occurred mid-table and left every remaining row behind."""
    s = None
    for i, l in enumerate(lines):
        if re.search(start_pat, l):
            s = i
            break
    if s is None:
        sys.exit(f"could not locate block starting {start_pat!r} — refusing to write a partial copy")
    e = s
    for i in range(s, len(lines)):
        if lines[i].startswith(">") or not lines[i].strip():
            e = i
        else:
            break
    # Trim trailing blanks back inside the quote so the stand-in reads cleanly.
    while e > s and not lines[e].strip():
        e -= 1
    return lines[:s] + [replacement] + lines[e + 1:]


def main():
    os.chdir(HERE)
    if not os.path.exists(SRC):
        sys.exit(f"{SRC} not found — run tools-make-transcript.py first")
    text = open(SRC, encoding="utf-8").read()
    lines = text.splitlines()

    # 1. The assignment's funnel table, pasted verbatim. Keep the fact that it
    #    arrived; drop the figures, the URLs and the event inventory.
    lines = drop_quoted_block(
        lines,
        r"^> Important: these are sessions, not verified individual patients",
        "> *[The assignment's funnel and instrumentation tables were pasted here. "
        "Removed from this copy — the data belongs to whoever set the exercise.]*",
    )
    body = "\n".join(lines)

    # 2. Identifiers and machine specifics.
    subs = [
        (r"\bvijeta\.gera@gmail\.com\b", "[email]"),
        (r"/Users/vijeta", "/Users/[user]"),
        (r"\b(?:10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", "[local-ip]"),
        (r"\bvijeta@PSSVServer-[A-Za-z0-9]+\b", "[host]"),
        # 3. Unrelated work on the same machine.
        (r"(?i)\bstoryboard\b", "another prototype"),
        (r"(?i)\bstoryboard\.service\b", "another prototype's unit"),
        (r"\b8090, 8091, 8094–8099\b", "other local ports"),
        (r"\(8090, 8091, 8094–8099\)", "(other local ports)"),
    ]
    for pat, rep in subs:
        body = re.sub(pat, rep, body)

    # 4. Residual figures from the funnel, quoted outside the pasted block.
    for fig in ["5,898", "5898", "1,403", "4,495", "3,013", "1,912", "1,104",
                "3,578", "5,490", "3,338", "3,095", "1,909", "1,764", "1,763"]:
        body = body.replace(fig, "[n]")
    body = re.sub(r"/portal/join[a-z/_]*", "[assignment route]", body)
    body = re.sub(r"\bportal\.(?:page|onboarding|provider|reschedule_preferences)[A-Za-z0-9_.]*",
                  "[assignment event]", body)

    # Front matter, after the title block.
    parts = body.split("\n", 1)
    body = parts[0] + "\n\n" + NOTE + "\n" + (parts[1] if len(parts) > 1 else "")

    # Verify, then write. A failed check must not produce a file.
    banned = {
        "real email": r"vijeta\.gera@gmail\.com",
        "mac username": r"/Users/vijeta\b",
        "local IP": r"\b(?:10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        "hostname": r"PSSVServer",
        "funnel totals": r"\b5,?898\b|\b1,?403\b",
        "assignment routes": r"/portal/join",
        "other project": r"(?i)\bstoryboard\b",
        "assignment events": r"\bportal\.(?:page|onboarding|provider)\b",
        "instrumentation rows": r"explicitly instrumented",
    }
    bad = {k: len(re.findall(v, body)) for k, v in banned.items() if re.search(v, body)}
    if bad:
        sys.exit(f"refusing to write {OUT}: still present -> {bad}")

    open(OUT, "w", encoding="utf-8").write(body.rstrip() + "\n")
    print(f"wrote {OUT} — {len(body.splitlines())} lines "
          f"(source {len(text.splitlines())}), all {len(banned)} checks clean")


if __name__ == "__main__":
    main()
