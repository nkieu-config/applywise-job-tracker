"use client";

import { useEffect } from "react";

// Catches errors thrown by the root layout itself, which the route-level
// error.tsx can't reach. It replaces the whole document, so it must render its
// own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong · Applywise</title>
      </head>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#696969" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.75rem",
              borderRadius: "90px",
              border: "none",
              background: "#4a154b",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <p style={{ marginTop: "1rem" }}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                the root layout is what crashed, so a client-side navigation
                would re-enter the broken tree; this needs a full page load. */}
            <a href="/" style={{ color: "#4a154b", fontWeight: 700 }}>
              Back to Applywise
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
