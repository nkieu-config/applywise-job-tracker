import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

const updateApplicationStatus = vi.fn();
vi.mock("@/actions/applications", () => ({
  updateApplicationStatus: (...a: unknown[]) => updateApplicationStatus(...a),
}));
vi.mock("@/components/ui/toast", () => ({ useToast: () => vi.fn() }));

const { ApplicationsBoard } = await import("@/components/applications/board");

const APPS = [
  {
    id: "a1",
    role: "Backend Engineer",
    company: "Acme",
    status: "SAVED" as const,
    deadline: null,
  },
];

beforeEach(() => {
  updateApplicationStatus.mockReset().mockResolvedValue({});
  localStorage.clear();
});

describe("ApplicationsBoard accessibility", () => {
  it("never nests the card link inside an interactive drag control", () => {
    render(<ApplicationsBoard applications={APPS} />);
    const link = screen.getByRole("link", { name: /Backend Engineer/ });

    let ancestor = link.parentElement;
    while (ancestor) {
      expect(ancestor.getAttribute("role")).not.toBe("button");
      expect(ancestor.tagName).not.toBe("BUTTON");
      expect(ancestor.hasAttribute("tabindex")).toBe(false);
      ancestor = ancestor.parentElement;
    }
  });

  it("exposes exactly one link and one labelled move control per card", () => {
    render(<ApplicationsBoard applications={APPS} />);

    expect(screen.getAllByRole("link", { name: /Backend Engineer/ })).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Move Backend Engineer at Acme" }),
    ).toBeInTheDocument();
  });

  // Dragging was the only way to restage a card. Stacked on a phone the drop
  // target sat screens below the card, and by keyboard dnd-kit moved it 25px
  // per arrow press — so the control has to offer the move outright.
  it("offers every status from the card, without a drag", () => {
    render(<ApplicationsBoard applications={APPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Move Backend Engineer at Acme" }),
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    for (const label of ["Saved", "Applied", "Interview", "Offer", "Rejected"]) {
      expect(
        within(dialog).getByRole("button", { name: label, hidden: true }),
      ).toBeInTheDocument();
    }
  });

  it("moves the card when a status is chosen", () => {
    render(<ApplicationsBoard applications={APPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Move Backend Engineer at Acme" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog", { hidden: true })).getByRole("button", {
        name: "Interview",
        hidden: true,
      }),
    );

    expect(updateApplicationStatus).toHaveBeenCalledWith("a1", "INTERVIEW");
  });

  it("collapses a column at every breakpoint, so aria-expanded is never a lie", () => {
    render(<ApplicationsBoard applications={APPS} />);
    const header = screen.getByRole("button", { name: /Saved/ });
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(header);

    expect(header).toHaveAttribute("aria-expanded", "false");
    const body = screen.getByRole("link", { name: /Backend Engineer/ })
      .parentElement!.parentElement!;
    expect(body.className).toContain("hidden");
    expect(body.className).not.toMatch(/lg:(flex|block|grid)\b/);
  });
});
