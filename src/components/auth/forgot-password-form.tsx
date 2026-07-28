"use client";

import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-styles";

export function ForgotPasswordForm() {
  const hydrated = useHydrated();
  const emailRef = useRef<HTMLInputElement>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = emailRef.current?.value ?? "";
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSent(email);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  if (sent !== null) {
    return (
      <p
        role="status"
        className="rounded-lg bg-canvas-lavender px-4 py-3 text-center font-sans text-body text-ink"
      >
        If an account exists for <b>{sent}</b>, we&apos;ve sent it a reset link.
        It expires in 1 hour.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className={labelClass}>
        Email
        <input
          ref={emailRef}
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-semantic-error-tint px-4 py-3 text-body text-semantic-error font-medium"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading || !hydrated}
        aria-busy={!hydrated || loading}
        className="mt-2"
      >
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
