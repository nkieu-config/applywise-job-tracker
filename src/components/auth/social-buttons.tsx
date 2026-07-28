"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { buttonClass } from "@/components/ui/button";
import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/oauth-providers";

function ProviderIcon({ id }: { id: OAuthProviderId }) {
  if (id === "github") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
        <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.74Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.75l3.99-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.63l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

export function SocialButtons({
  providers,
  disabled,
  onError,
}: {
  providers: OAuthProviderId[];
  disabled?: boolean;
  onError?: (msg: string | null) => void;
}) {
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const hydrated = useHydrated();
  const available = OAUTH_PROVIDERS.filter((p) => providers.includes(p.id));

  if (available.length === 0) return null;

  async function continueWith(id: OAuthProviderId) {
    setPending(id);
    onError?.(null);
    try {
      const { error } = await signIn.social({
        provider: id,
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in",
      });
      // A successful call redirects the browser to the provider, so reaching
      // here without a redirect means the request itself failed to start.
      if (error) {
        onError?.("Couldn't reach the sign-in provider. Please try again.");
        setPending(null);
      }
    } catch {
      onError?.("Couldn't reach the sign-in provider. Please try again.");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {available.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => continueWith(provider.id)}
          disabled={disabled || pending !== null || !hydrated}
          aria-busy={!hydrated || pending === provider.id}
          className={buttonClass({
            variant: "outline",
            size: "lg",
            className: "w-full gap-2.5",
          })}
        >
          <ProviderIcon id={provider.id} />
          {pending === provider.id
            ? `Redirecting to ${provider.label}…`
            : `Continue with ${provider.label}`}
        </button>
      ))}
    </div>
  );
}
