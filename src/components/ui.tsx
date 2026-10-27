"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const sw = { strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", ...sw };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {name === "mic" && (
        <g {...p}>
          <rect x="9" y="2.5" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </g>
      )}
      {name === "speaker" && (
        <g {...p}>
          <path d="M4 9.5h3L11.5 5v14L7 14.5H4z" />
          <path d="M15 9.2a4 4 0 0 1 0 5.6M17.8 6.6a7.8 7.8 0 0 1 0 10.8" />
        </g>
      )}
      {name === "chat" && (
        <g {...p}>
          <path d="M20.5 12.2c0 3.9-3.8 7-8.5 7-1 0-2-.1-2.9-.4L4 20.5l1.3-3.4A6.6 6.6 0 0 1 3.5 12.2c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z" />
        </g>
      )}
      {name === "list" && (
        <g {...p}>
          <path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
        </g>
      )}
      {name === "check" && <g {...p}><path d="M4.5 12.5l5 5 10-11" /></g>}
      {name === "arrow" && <g {...p}><path d="M4.5 12h15M13 5.5l6.5 6.5L13 18.5" /></g>}
      {name === "back" && <g {...p}><path d="M19.5 12h-15M11 5.5L4.5 12 11 18.5" /></g>}
      {name === "clock" && <g {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></g>}
      {name === "shield" && <g {...p}><path d="M12 3.2l7 2.6v5.6c0 4.2-2.9 7.6-7 9.4-4.1-1.8-7-5.2-7-9.4V5.8z" /><path d="M8.8 12.2l2.2 2.2 4.2-4.6" /></g>}
      {name === "spark" && <g {...p}><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" /></g>}
      {name === "video" && <g {...p}><rect x="3" y="6.5" width="12" height="11" rx="2.5" /><path d="M15 11l5.5-3v8L15 13z" /></g>}
      {name === "phone" && <g {...p}><path d="M6.5 3.5h3l1.6 4-2 1.4a10.5 10.5 0 0 0 5 5l1.4-2 4 1.6v3c0 1.1-.9 2-2 2A14.5 14.5 0 0 1 4.5 5.5c0-1.1.9-2 2-2z" /></g>}
      {name === "heart" && <g {...p}><path d="M12 20s-7.5-4.4-7.5-9.3A4.2 4.2 0 0 1 12 8.2 4.2 4.2 0 0 1 19.5 10.7C19.5 15.6 12 20 12 20z" /></g>}
      {name === "link" && <g {...p}><path d="M10 13.5l4-4M8.5 15.5l-1 1a3.5 3.5 0 0 1-5-5l3-3M15.5 8.5l1-1a3.5 3.5 0 0 1 5 5l-3 3" /></g>}
      {name === "info" && <g {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8h.01" /></g>}
      {name === "card" && <g {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M6.5 14.5h4" /></g>}
      {name === "x" && <g {...p}><path d="M6 6l12 12M18 6L6 18" /></g>}
      {name === "pencil" && <g {...p}><path d="M4.5 19.5h4L20 8a2.1 2.1 0 0 0-3-3L5.5 16.5z" /></g>}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "quiet";
  size?: "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", className = "", ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500";
  const sizes =
    size === "lg"
      ? "min-h-[3.25rem] px-7 py-3.5 text-[1.0625rem]"
      : "min-h-[2.75rem] px-5 py-2.5 text-[0.9375rem]";
  const variants: Record<string, string> = {
    primary: "bg-slate-500 text-white hover:bg-slate-600 shadow-sm",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-50",
    quiet: "text-muted hover:text-ink hover:bg-black/5",
  };
  return <button ref={ref} className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest} />;
});

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  className = "",
  children,
  role,
}: {
  className?: string;
  children: React.ReactNode;
  role?: React.AriaRole;
}) {
  return (
    <div role={role} className={`rounded-xl2 border border-line bg-panel shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "slate" | "sage" | "clay" | "alert";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-black/[0.04] text-muted",
    slate: "bg-slate-50 text-slate-600",
    sage: "bg-sage-100 text-sage-600",
    clay: "bg-clay-100 text-clay-600",
    alert: "bg-alert-100 text-alert-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Choice controls                                                     */
/* ------------------------------------------------------------------ */

export function Chip({
  selected,
  children,
  onClick,
  single = false,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  /** Single-select options are radios, not toggle buttons. */
  single?: boolean;
}) {
  return (
    <button
      type="button"
      role={single ? "radio" : undefined}
      aria-checked={single ? selected : undefined}
      aria-pressed={single ? undefined : selected}
      onClick={onClick}
      className={`inline-flex min-h-[3rem] items-center gap-2.5 rounded-full border px-4 py-2.5 text-left text-[0.95rem] transition ${
        selected
          ? "border-slate-500 bg-slate-50 text-slate-700 font-medium"
          : "border-line bg-panel text-ink hover:border-slate-200 hover:bg-slate-50/50"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center border ${
          single ? "rounded-full" : "rounded-[0.3rem]"
        } ${selected ? "border-slate-500 bg-slate-500 text-white" : "border-slate-300"}`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 6.5" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

export function OptionCard({
  selected,
  title,
  detail,
  note,
  onClick,
}: {
  selected: boolean;
  title: string;
  detail?: string;
  note?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full rounded-xl2 border p-4 text-left transition sm:p-5 ${
        selected
          ? "border-slate-500 bg-slate-50 ring-1 ring-slate-500"
          : "border-line bg-panel hover:border-slate-200 hover:shadow-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-slate-500" : "border-line"
          }`}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{title}</span>
          {detail && <span className="mt-1 block text-sm leading-relaxed text-muted">{detail}</span>}
          {note && <span className="mt-2 block text-xs text-muted">{note}</span>}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.9375rem] font-medium text-ink">
      {children}
      {hint && <span className="ml-2 font-normal text-faint">{hint}</span>}
    </label>
  );
}

/** Applied to an invalid control alongside aria-invalid. */
export const invalidClass = "border-alert-500 ring-1 ring-alert-500/40";

export const inputClass =
  "w-full rounded-xl border border-line bg-panel px-3.5 py-3 text-[1rem] text-ink placeholder:text-faint focus:border-slate-300 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-200";

export function TextField({
  id,
  value,
  onChange,
  className = "",
  ...rest
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id" | "className">) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Provider avatar — procedural, no stock photos                       */
/* ------------------------------------------------------------------ */

export function Avatar({ name, tint, size = 56 }: { name: string; tint: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-serif"
      style={{
        width: size,
        height: size,
        background: `${tint}1a`,
        color: tint,
        border: `1px solid ${tint}33`,
        fontSize: size * 0.36,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading used on every step                                  */
/* ------------------------------------------------------------------ */

export function StepHeading({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{eyebrow}</div>}
        <h1 id="step-heading" tabIndex={-1} className="font-serif text-[1.5rem] leading-tight text-ink outline-none sm:text-[1.9rem]">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
