import Link from "next/link";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-m-2 inline-block p-2 font-sans text-body font-bold text-ink-mute transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
