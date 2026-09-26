import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BackgroundComponent } from "./background-components";

describe("BackgroundComponent", () => {
  it("uses the normal site surface without a yellow radial overlay", () => {
    const { container } = render(<BackgroundComponent>Content</BackgroundComponent>);
    const background = container.firstElementChild;

    expect(background).toHaveClass("bg-background");
    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeInTheDocument();
  });
});
