"use client";

import { useEffect, useState } from "react";

/** Reload with a fresh document, bypassing whatever the browser has cached. */
function hardReload() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("_r", String(Date.now()));
    window.location.replace(u.toString());
  } catch {
    window.location.reload();
  }
}

/**
 * Something broke on the client. For this audience the error screen is still a
 * care surface: it says what to do, keeps 988 and the practice number visible,
 * and never implies the patient did something wrong.
 *
 * By far the most common cause is a stale document — the tab was open across a
 * rebuild, so the JS it asks for no longer exists. An ordinary reload re-serves
 * the same cached HTML and fails identically, so the first recovery attempt in
 * a session is a cache-busting reload. If that didn't fix it, we stop retrying
 * and show what actually went wrong instead of looping.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [retried, setRetried] = useState(true);

  useEffect(() => {
    let already = false;
    try {
      already = sessionStorage.getItem("cmp.recovered") === "1";
      sessionStorage.setItem("cmp.recovered", "1");
    } catch {
      already = true; // private mode — go straight to the manual buttons
    }
    setRetried(already);
    if (!already) {
      const t = setTimeout(hardReload, 300);
      return () => clearTimeout(t);
    }
  }, []);

  const detail = [error?.name, error?.message].filter(Boolean).join(": ");

  if (!retried) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <h1 className="font-serif text-[1.6rem] leading-tight text-ink">Getting the latest version…</h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-muted">One moment. This isn&rsquo;t anything you did.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-serif text-[1.6rem] leading-tight text-ink">Something on our end broke.</h1>
      <p className="mt-3 text-[1rem] leading-relaxed text-muted">
        Nothing you typed was lost on your device, and this isn&rsquo;t anything you did. You can try again, or call
        us and we&rsquo;ll book you over the phone.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <button
          onClick={() => {
            try { sessionStorage.removeItem("cmp.recovered"); } catch { /* noop */ }
            reset();
          }}
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-slate-500 px-7 text-[1.0625rem] font-medium text-white"
        >
          Try again
        </button>
        <button
          onClick={() => {
            try { sessionStorage.removeItem("cmp.recovered"); } catch { /* noop */ }
            hardReload();
          }}
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-slate-200 bg-panel px-7 text-[1.0625rem] font-medium text-slate-600"
        >
          Reload a fresh copy
        </button>
        <a
          href="tel:+15125550100"
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-7 text-[1.0625rem] font-medium text-slate-600"
        >
          Call us: (512) 555-0100
        </a>
      </div>

      <div className="mt-9 rounded-xl2 border border-line bg-panel p-5">
        <h2 className="font-medium text-ink">If you need someone now</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          Call or text{" "}
          <a href="tel:988" className="font-semibold text-slate-600 underline decoration-current underline-offset-2">988</a>{" "}
          — free, any hour. If you&rsquo;re in danger right now, call 911.
        </p>
      </div>

      {/* Prototype: the real message, so a defect can be diagnosed without a round trip. */}
      {detail && (
        <details className="mt-7">
          <summary className="cursor-pointer text-xs text-muted">Technical detail</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-panel p-3 text-xs text-muted">
            {detail}
            {error?.digest ? `\ndigest: ${error.digest}` : ""}
          </pre>
        </details>
      )}
    </main>
  );
}
