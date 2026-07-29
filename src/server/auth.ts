import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/prisma";
import { postgresRateLimitStorage } from "@/server/auth-rate-limit";
import { socialProvidersConfig } from "@/server/oauth";
import { sendEmail } from "@/server/email";
import { DEMO_EMAIL } from "@/lib/constants/demo";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const SESSION_REFRESH_AFTER_SECONDS = 60 * 60 * 24;
const SESSION_COOKIE_CACHE_SECONDS = 60 * 5;
const VERIFICATION_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: VERIFICATION_TOKEN_EXPIRES_IN_SECONDS,
    sendVerificationEmail: async ({ user, url }) => {
      if (user.email === DEMO_EMAIL) return;
      await sendEmail({
        to: user.email,
        subject: "Verify your email for Applywise",
        text: `Welcome to Applywise.\n\nConfirm this address here (the link expires in 24 hours):\n${url}\n\nIf you didn't create this account, ignore this email.`,
      });
    },
  },
  socialProviders: socialProvidersConfig(),
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    updateAge: SESSION_REFRESH_AFTER_SECONDS,
    cookieCache: {
      enabled: true,
      maxAge: SESSION_COOKIE_CACHE_SECONDS,
    },
  },
  // Vercel routes a request through an edge region before the function, so
  // `x-forwarded-for` arrives as a chain. Better Auth refuses to trust a
  // multi-hop chain without a trusted-proxy list — correctly, since any hop
  // could be spoofed — and falls back to keying every caller under a single
  // "no-trusted-ip" bucket. That turns the sign-in limit below from 10 per
  // visitor into 10 for the whole site. `x-vercel-forwarded-for` and
  // `x-real-ip` are single-valued and set by the platform, so they resolve.
  advanced: {
    ipAddress: {
      ipAddressHeaders: [
        "x-vercel-forwarded-for",
        "x-real-ip",
        "x-forwarded-for",
      ],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
    },
    customStorage: postgresRateLimitStorage,
  },
  // nextCookies() must be the LAST plugin — it lets Better Auth set cookies
  // from Next.js server actions/route handlers.
  plugins: [nextCookies()],
});
