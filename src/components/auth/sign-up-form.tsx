"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { DemoButton } from "@/components/auth/demo-button";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button, buttonClass } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  fieldClass,
  fieldLabelClass,
  inputClass,
} from "@/components/ui/form-styles";
import type { OAuthProviderId } from "@/lib/oauth-providers";

const MIN_PASSWORD_LENGTH = 8;

type FieldName = "name" | "email" | "password";

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="font-sans text-body font-medium text-semantic-error">
      {children}
    </span>
  );
}

export function SignUpForm({
  oauthProviders = [],
}: {
  oauthProviders?: OAuthProviderId[];
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, React.ReactNode>>
  >({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate({ name, email, password }: Record<FieldName, string>) {
    const next: Partial<Record<FieldName, React.ReactNode>> = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "That does not look like an email address.";
    if (!password) next.password = "Choose a password.";
    else if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters — this one has ${password.length}.`;
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);

    const name = nameRef.current?.value ?? "";
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    const invalid = validate({ name, email, password });
    setFieldErrors(invalid);
    if (Object.keys(invalid).length > 0) {
      const first = (["name", "email", "password"] as const).find(
        (field) => invalid[field],
      );
      document.getElementById(`signup-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.email({ name, email, password });
      if (error) {
        // The commonest failure here is not a bad form, it is someone who
        // already has an account — so it is answered beside the email field
        // with the way out, rather than as a generic banner near the button.
        if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          setEmailTaken(true);
          document.getElementById("signup-email")?.focus();
        } else {
          setError(error.message ?? "Could not create your account.");
        }
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
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className={fieldClass}>
          <label htmlFor="signup-name" className={fieldLabelClass}>
            Name
          </label>
          <input
            ref={nameRef}
            id="signup-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "signup-name-error" : undefined}
            className={inputClass}
          />
          {fieldErrors.name && (
            <FieldError id="signup-name-error">{fieldErrors.name}</FieldError>
          )}
        </div>

        <div className={fieldClass}>
          <label htmlFor="signup-email" className={fieldLabelClass}>
            Email
          </label>
          <input
            ref={emailRef}
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email) || emailTaken}
            aria-describedby={
              emailTaken
                ? "signup-email-taken"
                : fieldErrors.email
                  ? "signup-email-error"
                  : undefined
            }
            className={inputClass}
          />
          {fieldErrors.email && (
            <FieldError id="signup-email-error">{fieldErrors.email}</FieldError>
          )}
          {emailTaken && (
            <FieldError id="signup-email-taken">
              That email already has an account.{" "}
              <Link
                href="/sign-in"
                className="font-bold text-link-blue underline underline-offset-4 transition-colors hover:text-link-hover"
              >
                Sign in instead
              </Link>
              .
            </FieldError>
          )}
        </div>

        <div className={fieldClass}>
          <label htmlFor="signup-password" className={fieldLabelClass}>
            Password
          </label>
          <PasswordInput
            ref={passwordRef}
            id="signup-password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "signup-password-error" : "signup-password-hint"
            }
          />
          {fieldErrors.password ? (
            <FieldError id="signup-password-error">
              {fieldErrors.password}
            </FieldError>
          ) : (
            <span
              id="signup-password-hint"
              className="text-body font-normal font-sans text-ink-mute"
            >
              At least {MIN_PASSWORD_LENGTH} characters.
            </span>
          )}
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
          {loading ? "Creating account…" : "Sign up"}
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
