import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CreateClassroom from "./CreateClassroom";

const { getSettings } = vi.hoisted(() => ({ getSettings: vi.fn().mockResolvedValue({ settings: { default_design_style: "manga" } }) }));
vi.mock("@/lib/api", () => ({ api: { classrooms: { create: vi.fn() }, settings: { get: getSettings } } }));

describe("CreateClassroom", () => {
  it("uses the saved default design style through a labelled radio group", async () => {
    render(
      <MemoryRouter>
        <CreateClassroom />
      </MemoryRouter>,
    );

    expect(screen.getByRole("progressbar", { name: "Classroom setup progress" })).toHaveAttribute("aria-valuenow", "1");

    fireEvent.change(screen.getByLabelText("Classroom Name *"), { target: { value: "Physics" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Subject *" }));
    fireEvent.click(screen.getByRole("option", { name: "physics" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Grade Level *" }));
    fireEvent.click(screen.getByRole("option", { name: "Grade 8" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("progressbar", { name: "Classroom setup progress" })).toHaveAttribute("aria-valuenow", "2");

    const manga = screen.getByRole("radio", { name: "Manga" });
    await waitFor(() => expect(manga).toBeChecked());
    expect(screen.getByRole("radiogroup", { name: "Design Style *" })).toBeInTheDocument();
  });
});
