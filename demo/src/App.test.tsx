import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const landingModule = vi.hoisted(() => {
  let resolve!: (module: { default: () => JSX.Element }) => void;
  const promise = new Promise<{ default: () => JSX.Element }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
});

vi.mock("./pages/shared/Landing", () => landingModule.promise);
vi.mock("sonner", () => ({ Toaster: () => null }));

describe("App routes", () => {
  it("shows a loading treatment while a lazy route page resolves", async () => {
    window.history.pushState({}, "", "/");
    const App = (await import("./App")).default;
    render(<App />);

    expect(screen.getByRole("status", { name: "Loading page" })).toBeInTheDocument();
    await act(async () => {
      landingModule.resolve({ default: () => <h1>Landing loaded</h1> });
    });
    expect(await screen.findByRole("heading", { name: "Landing loaded" })).toBeInTheDocument();
  });
});
