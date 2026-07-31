import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { encodeStreamEnd, type StreamEnd } from "@/lib/stream-protocol";

const saveTailoredBullets = vi.fn();
vi.mock("@/actions/applications", () => ({
  saveTailoredBullets: (...args: unknown[]) => saveTailoredBullets(...args),
}));

const toast = vi.fn();
vi.mock("@/components/ui/toast", () => ({ useToast: () => toast }));

const { TailorBullets } = await import("@/components/applications/tailor-bullets");

function respondWith(parts: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
  );
}

function respondWithBullets(text: string, end: StreamEnd) {
  respondWith([text, encodeStreamEnd(end)]);
}

function generate() {
  render(<TailorBullets id="app-1" initialExperience="Built a thing" />);
  fireEvent.click(screen.getByRole("button", { name: /tailor bullets/i }));
}

beforeEach(() => {
  saveTailoredBullets.mockReset().mockResolvedValue({ error: null });
  toast.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TailorBullets", () => {
  it("saves the bullets when the stream reports success", async () => {
    respondWithBullets("- Shipped a thing", { ok: true });
    generate();

    await waitFor(() => expect(saveTailoredBullets).toHaveBeenCalledTimes(1));
    expect(saveTailoredBullets).toHaveBeenCalledWith(
      "app-1",
      "Built a thing",
      "- Shipped a thing",
    );
    expect(toast).toHaveBeenCalledWith("Bullets saved to this application.");
  });

  it("does not persist a truncated response when the stream reports failure", async () => {
    respondWithBullets("- Shipped a th", {
      ok: false,
      error: "The AI stopped responding before it finished.",
    });
    generate();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /stopped responding/i,
      ),
    );
    expect(saveTailoredBullets).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not persist when the connection drops before the status frame", async () => {
    respondWith(["- Shipped a th"]);
    generate();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(saveTailoredBullets).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not persist an empty but successful response", async () => {
    respondWithBullets("   ", { ok: true });
    generate();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/empty response/i),
    );
    expect(saveTailoredBullets).not.toHaveBeenCalled();
  });
});

describe("stopping a generation in flight", () => {
  // A stream that delivers one chunk and then stalls, so `loading` stays true
  // until the hook's own AbortController errors it.
  function respondWithStalledStream(firstChunk: string) {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        controller.enqueue(encoder.encode(firstChunk));
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        init?.signal?.addEventListener("abort", () => {
          streamController.error(
            Object.assign(new Error("aborted"), { name: "AbortError" }),
          );
        });
        return Promise.resolve(new Response(body, { status: 200 }));
      }),
    );
  }

  it("offers a way out of a generation that is still running", async () => {
    respondWithStalledStream("- Half a bul");
    render(<TailorBullets id="app-1" initialExperience="Built a thing" />);
    fireEvent.click(screen.getByRole("button", { name: /tailor bullets/i }));

    const stop = await screen.findByRole("button", { name: "Stop" });
    expect(stop).toBeInTheDocument();
    expect(screen.getByText(/Half a bul/).closest("[aria-live]")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("puts the saved copy back rather than leaving half a result on screen", async () => {
    respondWithStalledStream("- Half a bul");
    render(
      <TailorBullets
        id="app-1"
        initialExperience="Built a thing"
        initialOutput="- The bullets already saved"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /regenerate bullets/i }));

    fireEvent.click(await screen.findByRole("button", { name: "Stop" }));

    await waitFor(() =>
      expect(screen.getByText("- The bullets already saved")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Half a bul/)).toBeNull();
    // A deliberate stop is not a failure, so nothing is reported as one.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(saveTailoredBullets).not.toHaveBeenCalled();
  });
});
