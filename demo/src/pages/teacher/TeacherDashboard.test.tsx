import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherDashboard from "./TeacherDashboard";

const { getAll } = vi.hoisted(() => ({ getAll: vi.fn() }));

vi.mock("@/lib/api", () => ({ api: { classrooms: { getAll } } }));

describe("TeacherDashboard", () => {
  beforeEach(() => {
    getAll.mockReset().mockResolvedValue({
      classrooms: [{
        id: "classroom-1",
        name: "Physics Lab",
        subject: "Physics",
        grade_level: "8",
        student_count: 4,
        story_count: 2,
      }],
    });
  });

  it("uses named workshop actions instead of an unlabeled floating control", async () => {
    render(
      <MemoryRouter>
        <TeacherDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "My Classrooms" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create classroom" })).toHaveAttribute("href", "/teacher/classroom/new");
    expect(screen.getByRole("link", { name: "Open Physics Lab" })).toHaveAttribute("href", "/teacher/classroom/classroom-1");
    expect(screen.getByRole("link", { name: "Open Physics Lab" })).toHaveClass("bg-primary");
    expect(screen.getAllByRole("link").every((link) => Boolean(link.getAttribute("aria-label") || link.textContent?.trim()))).toBe(true);
  });
});
