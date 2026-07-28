import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";

const signInEmail = vi.fn();
const signUpEmail = vi.fn();
const requestPasswordReset = vi.fn();
const resetPassword = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signIn: { email: (...a: unknown[]) => signInEmail(...a), social: vi.fn() },
  signUp: { email: (...a: unknown[]) => signUpEmail(...a) },
  authClient: {
    requestPasswordReset: (...a: unknown[]) => requestPasswordReset(...a),
    resetPassword: (...a: unknown[]) => resetPassword(...a),
  },
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => vi.fn() }));

const { SignInForm } = await import("@/components/auth/sign-in-form");
const { SignUpForm } = await import("@/components/auth/sign-up-form");
const { ForgotPasswordForm } = await import(
  "@/components/auth/forgot-password-form"
);
const { ResetPasswordForm } = await import(
  "@/components/auth/reset-password-form"
);

// Typing before React hydrates reaches the DOM but never reaches React: no
// change event is delivered, so state stays empty while the field visibly
// holds what was typed. Assigning `.value` without firing an event reproduces
// exactly that, and is what these tests submit against.
function typeUnseen(field: HTMLElement, value: string) {
  (field as HTMLInputElement).value = value;
}

beforeEach(() => {
  signInEmail.mockReset().mockResolvedValue({ error: null });
  signUpEmail.mockReset().mockResolvedValue({ error: null });
  requestPasswordReset.mockReset().mockResolvedValue({ error: null });
  resetPassword.mockReset().mockResolvedValue({ error: null });
  push.mockReset();
});

describe("auth forms submit what the field holds, not what React saw", () => {
  it("sign-in sends text typed before hydration", async () => {
    render(<SignInForm />);
    typeUnseen(screen.getByLabelText("Email"), "ada@example.com");
    typeUnseen(
      screen.getByLabelText("Password", { exact: true }),
      "correct-horse",
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));

    await waitFor(() =>
      expect(signInEmail).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "correct-horse",
      }),
    );
  });

  it("sign-up sends text typed before hydration", async () => {
    render(<SignUpForm />);
    typeUnseen(screen.getByLabelText("Name"), "Ada Lovelace");
    typeUnseen(screen.getByLabelText("Email"), "ada@example.com");
    typeUnseen(
      screen.getByLabelText("Password", { exact: true }),
      "correct-horse-battery",
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign up", exact: true }));

    await waitFor(() =>
      expect(signUpEmail).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "correct-horse-battery",
      }),
    );
  });

  it("sign-up does not reject a filled field as empty", async () => {
    render(<SignUpForm />);
    typeUnseen(screen.getByLabelText("Name"), "Ada Lovelace");
    typeUnseen(screen.getByLabelText("Email"), "ada@example.com");
    typeUnseen(
      screen.getByLabelText("Password", { exact: true }),
      "correct-horse-battery",
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign up", exact: true }));

    await waitFor(() => expect(signUpEmail).toHaveBeenCalled());
    expect(screen.queryByText("Enter your name.")).toBeNull();
    expect(screen.queryByText("Enter your email address.")).toBeNull();
  });

  it("forgot-password sends text typed before hydration", async () => {
    render(<ForgotPasswordForm />);
    typeUnseen(screen.getByLabelText("Email"), "ada@example.com");

    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(requestPasswordReset).toHaveBeenCalledWith({
        email: "ada@example.com",
        redirectTo: "/reset-password",
      }),
    );
    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
  });

  it("reset-password compares what the two fields hold, not two empty strings", async () => {
    render(<ResetPasswordForm token="tok" />);
    typeUnseen(screen.getByLabelText("New password"), "correct-horse-battery");
    typeUnseen(screen.getByLabelText("Confirm new password"), "something-else");

    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByText("The two passwords don't match."),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("reset-password sends text typed before hydration", async () => {
    render(<ResetPasswordForm token="tok" />);
    typeUnseen(screen.getByLabelText("New password"), "correct-horse-battery");
    typeUnseen(
      screen.getByLabelText("Confirm new password"),
      "correct-horse-battery",
    );

    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        newPassword: "correct-horse-battery",
        token: "tok",
      }),
    );
  });
});

describe("auth submit buttons are disabled in the server HTML", () => {
  // Matched against the submit button alone. The pages also carry a DemoButton
  // that is already gated, so asserting on the whole document would pass even
  // with an ungated submit.
  function submitButtonHtml(element: React.ReactElement, label: string) {
    const html = renderToString(element);
    const match = html.match(
      new RegExp(`<button[^>]*>${label}</button>`, "u"),
    );
    if (!match) throw new Error(`no <button> rendering "${label}"`);
    return match[0];
  }

  const CASES: [string, React.ReactElement, string][] = [
    ["sign-in", <SignInForm key="a" />, "Sign in"],
    ["sign-up", <SignUpForm key="b" />, "Sign up"],
    ["forgot-password", <ForgotPasswordForm key="c" />, "Send reset link"],
    ["reset-password", <ResetPasswordForm key="d" token="tok" />, "Update password"],
  ];

  it.each(CASES)("%s", (_name, element, label) => {
    const button = submitButtonHtml(element, label);

    expect(button).toContain("disabled");
    expect(button).toContain('aria-busy="true"');
  });
});
