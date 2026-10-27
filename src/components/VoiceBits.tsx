"use client";

import React from "react";
import { useVoice, type MicBlock } from "@/lib/voice";
import { Icon } from "./ui";

/* ------------------------------------------------------------------ */
/* Microphone                                                          */
/*                                                                     */
/* The only voice feature: dictation into a free-text field. The app    */
/* never speaks, and choices are tapped, not spoken.                   */
/* ------------------------------------------------------------------ */

/** Says why the mic isn't there, without blaming the patient's settings. */
export function MicNote({ reason }: { reason: MicBlock }) {
  if (!reason || reason === "off") return null;
  return (
    <p className="text-xs leading-relaxed text-muted">
      {reason === "insecure"
        ? "Voice typing needs a secure (https) address, so it's off here. Typing works exactly the same."
        : "This browser can't do voice typing. Chrome or Edge can — typing works everywhere."}
    </p>
  );
}

export function MicButton({
  target,
  onResult,
  size = "md",
  label = "Type with your voice",
  continuous = false,
}: {
  target: string;
  onResult: (text: string, isFinal: boolean) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** Keep listening through a pause — for free text. */
  continuous?: boolean;
}) {
  const { sttSupported, listening, target: active, startListening, stopListening } = useVoice();
  const on = listening && active === target;
  if (!sttSupported) return null;

  const dims = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const ico = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={() => (on ? stopListening() : startListening(target, onResult, { continuous }))}
      aria-label={on ? "Stop listening" : label}
      aria-pressed={on}
      title={on ? "Stop listening" : label}
      className={`relative inline-flex ${dims} shrink-0 items-center justify-center rounded-full border transition ${
        on
          ? "border-slate-500 bg-slate-500 text-white"
          : "border-line bg-panel text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {on && <span className="absolute inset-0 animate-ping-slow rounded-full bg-slate-500/25" aria-hidden="true" />}
      <Icon name="mic" className={ico} />
    </button>
  );
}

/** A free-text area you can dictate into. */
export function DictateTextarea({
  id,
  value,
  onChange,
  target,
  rows = 4,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  target: string;
  rows?: number;
  placeholder?: string;
}) {
  const { sttSupported, micBlocked, listening, target: active, interim, error } = useVoice();
  const on = listening && active === target;
  const base = value;

  return (
    <div>
      <div
        className={`rounded-xl2 border bg-panel transition focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-200 ${
          on ? "border-slate-500 ring-1 ring-slate-200" : "border-line"
        }`}
      >
        <textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          value={on && interim ? `${base}${base ? " " : ""}${interim}` : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-xl2 bg-transparent px-4 py-3.5 text-[1rem] leading-relaxed text-ink placeholder:text-faint focus:outline-none"
        />
        {sttSupported ? (
          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-3 py-2.5">
            <p className="text-xs text-muted" aria-live="polite">
              {on ? "Listening — speak naturally, I'll keep typing." : "Type, or tap the mic and say it out loud."}
            </p>
            <MicButton
              target={target}
              size="md"
              label="Describe it out loud"
              continuous
              onResult={(text, isFinal) => {
                if (!isFinal) return;
                onChange(base ? `${base} ${text}`.trim() : text);
              }}
            />
          </div>
        ) : micBlocked && micBlocked !== "off" ? (
          <div className="border-t border-line/70 px-3 py-2.5">
            <MicNote reason={micBlocked} />
          </div>
        ) : null}
      </div>
      {error && <p className="mt-2 text-xs text-clay-600" role="alert">{error}</p>}
    </div>
  );
}
