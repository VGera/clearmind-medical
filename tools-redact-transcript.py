#!/usr/bin/env python3
"""Build TRANSCRIPT.md from CONVERSATION.md.

CONVERSATION.md is the full local record, trimmed at the cutoff set in
tools-make-transcript.py. This produces the committed copy, which differs from
it in two ways only:

  * personal identifiers come out — contact details, the paths and addresses of
    this machine, an SSH public key;
  * so do references to unrelated work that happens to live on the same box.

Nothing else is withheld. The exercise's funnel data stays in, because the repo
ships FUNNEL.md and DEMO.md carrying the same figures — stripping it from the
record alone protected nothing and made the record disagree with the files
beside it.

Verifies its own output and refuses to write the file if any rule still
matches, so a change upstream fails loudly instead of quietly publishing.
"""
import os
import re
import sys

SRC = "CONVERSATION.md"
OUT = "TRANSCRIPT.md"
HERE = os.path.dirname(os.path.abspath(__file__))

NOTE = """> **Note on this record.** This is the build conversation for this
> prototype, start to finish, including the places I got things wrong and had
> to back them out. Two things are taken out: personal contact details and the
> addresses of the machine it was built on, and passing references to unrelated
> projects on that machine. The record stops at 17:00 on 27 October.
>
> One exchange is worth reading in full rather than in isolation: at
> "Check Legion Health website and add some patients testimonies or make it
> up", the testimonials that resulted are original copy written in that
> format, not reused, and they are labelled on the page itself as
> "Sample reviews for this prototype — written for the demo, not real
> patients". Real reviews would need written patient authorisation.
"""

# (pattern, replacement). Order matters: the SSH key rule runs before anything
# that might rewrite the host comment on the end of the key.
SUBSTITUTIONS = [
    # Personal identifiers.
    (r"\bvijeta\.gera@gmail\.com\b", "[email]"),
    (r"\bssh-(?:ed25519|rsa|dss|ecdsa[A-Za-z0-9-]*)\s+[A-Za-z0-9+/=]{20,}(?:\s+\S+)?",
     "[ssh public key]"),
    (r"\bvijeta@PSSVServer-[A-Za-z0-9]+\b", "[host]"),
    (r"/Users/vijeta", "/Users/[user]"),
    (r"\b(?:10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", "[local-ip]"),
    # Unrelated work on the same machine.
    (r"(?i)\bstoryboard\.service\b", "another prototype's unit"),
    (r"(?i)\bstoryboard\b", "another prototype"),
    (r"8090, 8091, 8094–8099", "other local ports"),
]

# Checked against the output. Any hit means the file is not written.
BANNED = {
    "email address": r"vijeta\.gera@gmail\.com",
    "ssh public key": r"ssh-(?:ed25519|rsa|dss|ecdsa)\s+AAAA",
    "machine hostname": r"PSSVServer",
    "mac username": r"/Users/vijeta\b",
    "local IP address": r"\b(?:10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    "unrelated project": r"(?i)\bstoryboard\b",
}


def main():
    os.chdir(HERE)
    if not os.path.exists(SRC):
        sys.exit(f"{SRC} not found — run tools-make-transcript.py first")

    text = open(SRC, encoding="utf-8").read()
    body = text
    for pattern, replacement in SUBSTITUTIONS:
        body = re.sub(pattern, replacement, body)

    # Front matter, immediately after the title line.
    title, _, rest = body.partition("\n")
    body = f"{title}\n\n{NOTE}\n{rest}"

    still_there = {
        name: len(re.findall(pattern, body))
        for name, pattern in BANNED.items()
        if re.search(pattern, body)
    }
    if still_there:
        sys.exit(f"refusing to write {OUT}: still present -> {still_there}")

    open(OUT, "w", encoding="utf-8").write(body.rstrip() + "\n")
    print(f"wrote {OUT} — {len(body.splitlines())} lines "
          f"(source {len(text.splitlines())}), all {len(BANNED)} checks clean")


if __name__ == "__main__":
    main()
