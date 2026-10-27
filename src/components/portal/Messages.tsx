"use client";

import React, { useEffect, useRef, useState } from "react";
import { PRACTICE } from "@/lib/data";
import { detectCrisis } from "@/lib/parse";
import { agoLabel, THREAD, type Message } from "@/lib/portal/mock";
import { Button, Card, Icon } from "../ui";
import { MicButton } from "../VoiceBits";

const QUICK = [
  "I'd like a refill",
  "A side effect is bothering me",
  "Can we change my dose?",
  "I need to move my appointment",
];

/**
 * Asynchronous, but it must not feel like filing a form: the message appears
 * in the thread the instant it's sent, marked Sent, with the reply window
 * stated plainly underneath. A promise the practice can keep beats a chat
 * bubble nobody is watching.
 *
 * Refills arrive here rather than through a button of their own — see
 * Prescriptions for why.
 */
export function Messages({ seed, provider }: { seed?: string; provider: string }) {
  const [msgs, setMsgs] = useState<Message[]>(THREAD);
  const [draft, setDraft] = useState(seed ?? "");
  const [justSent, setJustSent] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (seed) { setDraft(seed); box.current?.focus(); }
  }, [seed]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  /* Latched for the session once it fires. The panel was bound to the draft
     alone, so sending the message — which this screen explicitly tells them to
     do — took the crisis resources off the screen at the exact moment they had
     just disclosed, and replaced them with a reply-time reassurance. */
  const [disclosed, setDisclosed] = useState(false);
  const crisis = detectCrisis(draft) || disclosed;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    if (detectCrisis(text)) setDisclosed(true);
    setMsgs((m) => [...m, { id: `m${Date.now()}`, from: "patient", text, ago: 0 }]);
    setDraft("");
    setJustSent(true);
    if (box.current) box.current.style.height = "auto";
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-[1.25rem] text-ink">Messages with {provider}</h2>
        <p className="text-sm text-muted">Replies within 1 business day</p>
      </div>

      <Card className="flex flex-col p-0">
        <div
          ref={scroller}
          role="log"
          aria-live="polite"
          aria-label={`Message thread with ${provider}`}
          className="space-y-3.5 overflow-y-auto overscroll-contain px-4 py-5"
          style={{ minHeight: "min(20rem, 38dvh)", maxHeight: "min(58dvh, 32rem)" }}
        >
          {msgs.map((m, i) => (
            <div key={m.id} className={`flex ${m.from === "patient" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[88%]">
                {m.from === "care-team" && (
                  <p className="mb-1 text-xs font-medium text-muted">{m.author}</p>
                )}
                <div
                  className={`break-words rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${
                    m.from === "patient" ? "bg-slate-500 text-white" : "border border-line bg-paper text-ink"
                  }`}
                >
                  {m.text}
                </div>
                <p className={`mt-1 text-xs text-muted ${m.from === "patient" ? "text-right" : ""}`}>
                  {m.ago === 0 ? (
                    <span className="inline-flex items-center gap-1 text-sage-600">
                      <Icon name="check" className="h-3.5 w-3.5" /> Sent
                    </span>
                  ) : (
                    agoLabel(m.ago)
                  )}
                  {i === msgs.length - 1 && m.from === "patient" && m.ago === 0 && (
                    <span className="ml-1 text-muted">· {provider} will see this before your next visit</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {justSent && (
          <div className="border-t border-line bg-sage-100/60 px-4 py-3">
            <p className="text-[0.95rem] leading-relaxed text-sage-600">
              {disclosed ? (
                <>Sent, and it will be read. {provider} replies within 1 business day — please don&rsquo;t wait
                on that if you need someone sooner.</>
              ) : (
                <>Sent. {provider} usually replies within 1 business day — you&rsquo;ll get a text when she does.
                You don&rsquo;t need to wait here.</>
              )}
            </p>
          </div>
        )}

        {crisis && (
          <div className="border-t border-alert-500/30 bg-alert-100/60 px-4 py-3.5">
            <p className="text-[0.95rem] leading-relaxed text-ink">
              Messages here aren&rsquo;t monitored around the clock. If you&rsquo;re thinking about hurting
              yourself, please{" "}
              <a href="tel:988" className="font-semibold text-alert-500 underline decoration-current underline-offset-2">
                call or text 988
              </a>{" "}
              now, or call us on{" "}
              <a href={PRACTICE.phoneHref} className="font-semibold text-slate-600 underline decoration-current underline-offset-2">
                {PRACTICE.phone}
              </a>
              . {justSent && disclosed ? "Your message has been sent, and it will be read." : "Send the message too \u2014 it will be read."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-line px-3 py-3">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => { setDraft(q); box.current?.focus(); }}
              className="min-h-[2.75rem] rounded-full border border-line bg-panel px-4 text-sm text-ink transition hover:border-slate-300 hover:bg-slate-50"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          className="flex items-end gap-2 border-t border-line px-3 py-3"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <textarea
            ref={box}
            rows={1}
            /* Generous, but bounded — there was no cap at all. */
            maxLength={4000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Write a message…"
            aria-label="Your message"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-line bg-panel px-3.5 py-2.5 text-[1rem] text-ink placeholder:text-faint focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <MicButton
            target="portal-msg"
            label="Say your message"
            continuous
            onResult={(text, isFinal) => { setDraft(text); if (isFinal) box.current?.focus(); }}
          />
          <Button type="submit" disabled={!draft.trim()} className="h-11 w-11 !min-h-0 !px-0">
            <span className="sr-only">Send</span>
            <Icon name="arrow" className="h-5 w-5" />
          </Button>
        </form>
      </Card>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        For anything urgent, call {PRACTICE.phone}. In a crisis, call or text{" "}
        <a href="tel:988" className="font-medium text-slate-600 underline decoration-current underline-offset-2">988</a>.
      </p>
    </div>
  );
}
