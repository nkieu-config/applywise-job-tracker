import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { default: RouteError } = await import("@/app/error");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("the route error screen", () => {
  // It used to render a bare <div> holding one "Try again" button and no links
  // at all, so an error that reproduced left the visitor with nowhere to go.
  it("is a landmarked page with a way out that is not a retry", () => {
    render(
      <RouteError error={new Error("boom")} reset={() => {}} />,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Applywise" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows the digest so a report can be tied to the server logs", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<RouteError error={error} reset={() => {}} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });
});
