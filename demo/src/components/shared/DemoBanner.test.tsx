import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("DemoBanner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("clearly labels the fictional read-only build", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    const { DemoBanner } = await import("./DemoBanner");

    render(<DemoBanner />);

    expect(screen.getByRole("status", { name: "Public demo" })).toHaveTextContent(
      "Public demo · Fictional data · Read-only",
    );
    expect(screen.getByRole("status", { name: "Public demo" })).toHaveClass("shrink-0");
  });
});
