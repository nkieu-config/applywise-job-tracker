"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/form-styles";

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentPropsWithRef<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative flex">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputClass, "w-full pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((on) => !on)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-sm text-ink-mute transition-colors hover:text-ink"
      >
        <Icon size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
