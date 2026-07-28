"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { Button, buttonClass } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  fieldClass,
  fieldLabelClass,
} from "@/components/ui/form-styles";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const password = passwordRef.current?.value ?? "";
    const confirm = confirmRef.current?.value ?? "";

    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) {
        setError(error.message ?? "This reset link is invalid or has expired.");
        setLoading(false);
        return;
      }
      router.push("/sign-in?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="alert"
          className="rounded-lg bg-semantic-error-tint px-4 py-3 text-center text-body font-medium text-semantic-error"
        >
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className={buttonClass({ size: "lg" })}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className={fieldClass}>
        <label htmlFor="reset-password" className={fieldLabelClass}>
          New password
        </label>
        <PasswordInput
          ref={passwordRef}
          id="reset-password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-describedby="reset-password-hint"
        />
        <span
          id="reset-password-hint"
          className="font-sans text-body font-normal text-ink-mute"
        >
          At least 8 characters.
        </span>
      </div>

      <div className={fieldClass}>
        <label htmlFor="reset-confirm" className={fieldLabelClass}>
          Confirm new password
        </label>
        <PasswordInput
          ref={confirmRef}
          id="reset-confirm"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

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
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
