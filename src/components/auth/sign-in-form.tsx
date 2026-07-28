"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { DemoButton } from "@/components/auth/demo-button";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button, buttonClass } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  fieldClass,
  fieldLabelClass,
  inputClass,
  labelClass,
} from "@/components/ui/form-styles";
import type { OAuthProviderId } from "@/lib/oauth-providers";

export function SignInForm({
  passwordWasReset = false,
  canResetPassword = false,
  oauthProviders = [],
}: {
  passwordWasReset?: boolean;
  canResetPassword?: boolean;
  oauthProviders?: OAuthProviderId[];
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await signIn.email({
        email: emailRef.current?.value ?? "",
        password: passwordRef.current?.value ?? "",
      });
      if (error) {
        setError(
          error.code === "EMAIL_NOT_VERIFIED"
            ? "Verify your email first — we've just sent a fresh link to your inbox."
            : (error.message ?? "Invalid email or password."),
        );
        setLoading(false);
        return;
      }
      // Keep the button disabled through navigation so a second submit can't
      // fire during the redirect.
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {passwordWasReset && !error && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-canvas-lavender px-4 py-3 text-center font-sans text-body text-ink"
        >
          Your password has been updated. Sign in with it below.
        </p>
      )}

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

        <div className={fieldClass}>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="signin-password" className={fieldLabelClass}>
              Password
            </label>
            {canResetPassword && (
              <Link
                href="/forgot-password"
                className="-my-2 py-2 font-sans text-body font-bold text-link-blue transition-colors hover:text-link-hover hover:underline"
              >
                Forgot?
              </Link>
            )}
          </div>
          <PasswordInput
            ref={passwordRef}
            id="signin-password"
            required
            autoComplete="current-password"
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
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-body font-sans text-ink-mute">
        <span className="h-px flex-1 bg-hairline" />
        or
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="flex flex-col gap-3">
        <SocialButtons
          providers={oauthProviders}
          onError={setError}
          disabled={loading}
        />
        <DemoButton
          onError={setError}
          disabled={loading}
          className={buttonClass({
            variant: "outline",
            size: "lg",
            className: "w-full",
          })}
        />
      </div>
    </>
  );
}
