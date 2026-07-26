import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "on-brand"
  | "outline-on-brand"
  | "ghost"
  | "danger"
  | "danger-solid";
export type ButtonSize = "sm" | "md" | "lg";

// Every variant carries the same 2px border, transparent where it is not drawn.
// Without it a bordered button is taller than a solid one at the same `size` —
// they were 52 / 54 / 56px — which shows up wherever two of them stack. The
// colour belongs to each variant rather than to a `border-transparent` here
// that variants override: `cn` is a plain join, so two border-colour classes on
// one element are resolved by stylesheet order, not by argument order.
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 font-sans font-bold whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-on-primary hover:bg-primary-press",
  secondary:
    "border-transparent bg-canvas-lavender text-ink hover:bg-canvas-lavender-hover",
  outline:
    "border-primary-ink bg-canvas text-primary-ink hover:bg-canvas-lavender",
  // The two actions inside the aubergine band. `primary` is the band's own
  // colour and would vanish into it; `ghost` is a light chip and would float on
  // it. Both of these borrow the band's foreground instead — solid for the
  // action being asked for, outlined for the one beside it.
  "on-brand":
    "border-transparent bg-on-surface-brand text-surface-brand hover:bg-on-surface-brand/90",
  "outline-on-brand":
    "border-on-surface-brand bg-transparent text-on-surface-brand hover:bg-on-surface-brand/12",
  ghost: "border-hairline bg-canvas text-ink hover:bg-canvas-lavender",
  danger:
    "border-transparent bg-semantic-error-tint text-semantic-error hover:bg-semantic-error-hover",
  "danger-solid":
    "border-transparent bg-semantic-error-solid text-on-primary hover:opacity-90",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "text-body py-2 px-4",
  md: "text-body tracking-[0.144px] py-2.5 px-5",
  lg: "text-body-lg tracking-[0.2px] py-3.5 px-7",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, VARIANT[variant], SIZE[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}
