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

# The patterns live in .identity, which is gitignored: a tool whose job is to
# strip the hostname, the usernames and the local addresses should not itself
# publish them. Format is one rule per line, "pattern => replacement", with #
# for comments. Regex syntax.
IDENTITY = os.path.join(HERE, ".identity")


def rules():
    if not os.path.exists(IDENTITY):
        sys.exit(f"{IDENTITY} not found — refusing to write {OUT} without it, "
                 "since that would publish the record unredacted")
    out = []
    with open(IDENTITY, encoding="utf-8") as fh:
        for n, line in enumerate(fh, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=>" not in line:
                sys.exit(f"{IDENTITY}:{n}: expected 'pattern => replacement'")
            pat, _, rep = line.partition("=>")
            out.append((pat.strip(), rep.strip()))
    if not out:
        sys.exit(f"{IDENTITY} has no rules — refusing to write {OUT}")
    return out


def main():
    os.chdir(HERE)
    if not os.path.exists(SRC):
        sys.exit(f"{SRC} not found — run tools-make-transcript.py first")

    substitutions = rules()
    text = open(SRC, encoding="utf-8").read()
    body = text
    for pattern, replacement in substitutions:
        body = re.sub(pattern, replacement, body)

    # Front matter, immediately after the title line.
    title, _, rest = body.partition("\n")
    body = f"{title}\n\n{NOTE}\n{rest}"

    # Every rule is also its own check: if a pattern still matches after the
    # pass, something is wrong and the file must not be written.
    still_there = {
        pattern: len(re.findall(pattern, body))
        for pattern, _ in substitutions
        if re.search(pattern, body)
    }
    if still_there:
        sys.exit(f"refusing to write {OUT}: still present -> {still_there}")

    open(OUT, "w", encoding="utf-8").write(body.rstrip() + "\n")
    print(f"wrote {OUT} — {len(body.splitlines())} lines "
          f"(source {len(text.splitlines())}), all {len(substitutions)} rules clean")


if __name__ == "__main__":
    main()
