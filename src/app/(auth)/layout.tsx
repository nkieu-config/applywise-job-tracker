import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas">
      <header className="flex items-center justify-between p-4">
        <Link
          href="/"
          className="-m-2 inline-flex items-center gap-1.5 p-2 font-sans text-body font-medium text-ink-mute transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}
