import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Input } from "./input";

describe("Button", () => {
  it("keeps icon-only small buttons at least 44 pixels wide", () => {
    render(<Button size="sm" aria-label="Change layout" />);

    expect(screen.getByRole("button", { name: "Change layout" })).toHaveClass("min-w-11");
  });

  it("keeps workshop surfaces flat and controls touch friendly", () => {
    render(
      <Card data-testid="card">
        <CardContent data-testid="content">
          <Input aria-label="Lesson title" />
        </CardContent>
      </Card>,
    );

    expect(screen.getByTestId("card")).not.toHaveClass("shadow-sm");
    expect(screen.getByTestId("content")).toHaveClass("p-4", "sm:p-6");
    expect(screen.getByTestId("content")).not.toHaveClass("pt-0", "sm:pt-0");
    expect(screen.getByRole("textbox", { name: "Lesson title" })).toHaveClass("h-11", "bg-card");
  });
});
