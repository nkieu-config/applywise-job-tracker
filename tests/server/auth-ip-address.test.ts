import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Better Auth will not trust a multi-hop `x-forwarded-for` without a
// trusted-proxy list, and Vercel routes through an edge region before the
// function, so the header arrives as a chain. When the client IP cannot be
// resolved the limiter keys every caller under one shared "no-trusted-ip"
// bucket — which silently turns the 10-per-visitor sign-in limit into 10 for
// the entire site, and takes the public demo down for everyone once a handful
// of people click it in the same five minutes.
//
// The source is asserted rather than the built config because importing
// `server/auth` pulls in Prisma and the whole env surface for a fact that is
// purely declarative.
const source = readFileSync(
  resolve(process.cwd(), "src/server/auth.ts"),
  "utf8",
);

describe("auth ip address resolution", () => {
  it("declares single-valued proxy headers so rate limits key per visitor", () => {
    expect(source).toContain("ipAddressHeaders");
    expect(source).toContain("x-vercel-forwarded-for");
  });

  it("lists a platform header before x-forwarded-for", () => {
    const headers = source.slice(
      source.indexOf("ipAddressHeaders"),
      source.indexOf("rateLimit:"),
    );
    expect(headers.indexOf("x-vercel-forwarded-for")).toBeLessThan(
      headers.indexOf("x-forwarded-for\""),
    );
  });

  it("does not disable ip tracking", () => {
    expect(source).not.toContain("disableIpTracking: true");
  });
});
