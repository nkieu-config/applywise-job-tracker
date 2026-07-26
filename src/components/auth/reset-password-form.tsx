"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button, buttonClass } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  fieldClass,
  fieldLabelClass,
} from "@/components/ui/form-styles";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

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
          id="reset-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          id="reset-confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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

      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
