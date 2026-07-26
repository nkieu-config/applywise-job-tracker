"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants/demo";

export function DemoButton({
  className,
  label = "Try the demo account",
  loadingLabel = "Loading demo…",
  onError,
  disabled,
}: {
  className?: string;
  label?: string;
  loadingLabel?: string;
  onError?: (msg: string | null) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  function report(message: string) {
    if (onError) onError(message);
    else toast(message, "error");
  }

  async function loginDemo() {
    setDemoLoading(true);
    if (onError) onError(null);
    try {
      const { error } = await signIn.email({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) {
        // Every failure used to read "unavailable", which told a visitor
        // nothing and hid the one cause they can actually do something about:
        // the sign-in rate limit, which the demo shares with everyone.
        report(
          error.status === 429
            ? "The demo is busy right now — give it a minute and try again."
            : "The demo account is unavailable right now.",
        );
        return;
      }
      router.push("/dashboard");
    } catch {
      report("The demo account is unavailable right now.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={loginDemo}
      disabled={disabled || demoLoading}
      className={className}
    >
      {demoLoading ? loadingLabel : label}
    </button>
  );
}
