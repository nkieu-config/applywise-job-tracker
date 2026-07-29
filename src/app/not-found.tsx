import Link from "next/link";
import { getSession } from "@/server/get-session";
import { buttonClass } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

export default async function NotFound() {
  const session = await getSession();
  const home = session ? "/dashboard" : "/";

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center bg-canvas px-6 py-16"
    >
      <div className="flex flex-col items-center text-center">
        <Link href={home} aria-label="Applywise">
          <LogoMark size="lg" />
        </Link>
        <p className="mt-8 text-body font-sans font-medium text-ink-mute">404</p>
        <h1 className="mt-2 font-display-md text-ink tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 font-sans text-body-lg text-ink-mute">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          href={home}
          className={buttonClass({ size: "lg", className: "mt-6" })}
        >
          {session ? "Go to dashboard" : "Back to Applywise"}
        </Link>
      </div>
    </main>
  );
}
