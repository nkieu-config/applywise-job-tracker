"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // `digest` correlates this client-visible error with the full stack in the
    // server logs; without logging it there's no way to tie the two together.
    console.error("Route error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center bg-canvas px-6 py-16"
    >
      <div className="flex flex-col items-center text-center">
        <Link href="/" aria-label="Applywise">
          <LogoMark size="lg" />
        </Link>
        <h1 className="mt-8 font-display-md text-ink tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 font-sans text-body-lg text-ink-mute">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-caption text-ink-mute">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className={buttonClass({ variant: "outline", size: "lg" })}
          >
            Back to Applywise
          </Link>
        </div>
      </div>
    </main>
  );
}
