"use client";

/** Last resort: the root layout itself failed, so this renders its own document. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#f6f5f1",
          color: "#1e2a33",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "3rem 1.25rem" }}>
          <h1 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: "1.6rem", lineHeight: 1.2 }}>
            Something on our end broke.
          </h1>
          <p style={{ color: "#5c6b75", lineHeight: 1.6 }}>
            This isn&rsquo;t anything you did. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              minHeight: "3.25rem", padding: "0 1.75rem", borderRadius: 999, border: "none",
              background: "#2d5468", color: "#fff", fontSize: "1.0625rem", marginTop: "1.5rem",
            }}
          >
            Reload the page
          </button>
          <p style={{ color: "#5c6b75", lineHeight: 1.6, marginTop: "2.25rem" }}>
            If you need someone now, call or text <strong>988</strong> — free, any hour. Or call us at{" "}
            <strong>(512) 555-0100</strong>. If you&rsquo;re in danger, call 911.
          </p>
          {error?.digest && <p style={{ color: "#5c6b75", fontSize: 12 }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
