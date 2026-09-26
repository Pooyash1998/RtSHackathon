import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentStoryReader from "./StudentStoryReader";

const { getChapter } = vi.hoisted(() => ({ getChapter: vi.fn() }));

vi.mock("@/lib/api", () => ({ default: { chapters: { getById: getChapter } } }));
vi.mock("@/lib/runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/runtime")>()),
  isDemoMode: true,
}));

describe("StudentStoryReader", () => {
  beforeEach(() => {
    getChapter.mockReset();
    localStorage.clear();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });

  it("exposes reader controls and clamps an invalid saved scale", async () => {
    localStorage.setItem("storyReaderImageScale", "250");
    getChapter.mockResolvedValue({
      chapter: {
        id: "chapter-1", classroom_id: "classroom-1", index: 1, chapter_outline: null,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01", panels: [{
          id: "panel-1", chapter_id: "chapter-1", index: 1,
          image: "/media/story-images/chapter-1/panel-1.png", created_at: "2026-01-01",
        }],
      },
    });

    render(
      <MemoryRouter initialEntries={["/student/story/chapter-1/student-1"]}>
        <Routes><Route path="/student/story/:chapterId/:studentId" element={<StudentStoryReader />} /></Routes>
      </MemoryRouter>,
    );

    const slider = await screen.findByRole("slider", { name: "Image size" });
    expect(screen.getByRole("status", { name: "Public demo" })).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    expect(slider).toHaveAttribute("aria-valuetext", "100 percent");
    expect(screen.getByRole("button", { name: "Vertical layout" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("main", { name: "Comic panels" })).toHaveClass("reader-strip");
    expect(screen.getByRole("img", { name: "Panel 1 from Gravity" })).toBeInTheDocument();
    const grid = screen.getByRole("button", { name: "Grid layout" });
    fireEvent.click(grid);
    expect(grid).toHaveAttribute("aria-pressed", "true");
  });
});
