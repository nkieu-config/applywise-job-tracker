import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { LoadingScreen } from "@/components/ui/loading-screen";

function loadingFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) loadingFiles(path, found);
    else if (entry.name === "loading.tsx") found.push(path);
  }
  return found;
}

describe("LoadingScreen", () => {
  it("names the wait for anyone who cannot see the skeleton", () => {
    render(
      <LoadingScreen label="Loading your applications">
        <div />
      </LoadingScreen>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading your applications");
  });

  // Every skeleton in the app was a pile of pulsing divs and nothing else, so a
  // screen reader heard silence from the click until the page arrived. The
  // check is on the source because a route's loading.tsx only renders while a
  // real navigation is in flight.
  it("is used by every loading.tsx in the app", () => {
    const files = loadingFiles(resolve(process.cwd(), "src/app"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).toContain("LoadingScreen");
    }
  });
});
