import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentDashboard from "./StudentDashboard";

const { getChapters, getStudent } = vi.hoisted(() => ({
  getChapters: vi.fn(),
  getStudent: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    students: {
      getById: getStudent,
      getChapters,
    },
  },
}));

describe("StudentDashboard", () => {
  beforeEach(() => {
    getStudent.mockReset().mockResolvedValue({
      success: true,
      student: {
        id: "student-1",
        name: "Ada Student",
        interests: "Space",
        avatar_url: "/media/avatars/ada-full.png",
        avatar_thumbnail_url: "/media/avatars/ada-thumbnail.png",
        created_at: "2026-07-01T00:00:00Z",
      },
      classrooms: [{
        id: "classroom-1",
        name: "Weather Lab",
        subject: "Science",
        grade_level: "Grade 5",
        story_theme: "Weather Detectives",
        design_style: "comic",
      }],
    });
    getChapters.mockReset().mockResolvedValue({
      success: true,
      chapters: [
        {
          id: "generating",
          status: "generating",
          story_title: "Still Generating",
          created_at: "2026-07-31T03:00:00Z",
        },
        {
          id: "failed",
          status: "failed",
          story_title: "Failed Story",
          created_at: "2026-07-31T02:00:00Z",
        },
        {
          id: "ready",
          status: "ready",
          story_title: "Ready Story",
          index: 1,
          chapter_outline: "Legacy outline",
          original_prompt: "Teacher lesson prompt",
          story_description: "Students solve a fictional orbital rescue.",
          thumbnail_url: "/media/story-images/ready/preview.png",
          classroom_name: "Science",
          created_at: "2026-07-31T01:00:00Z",
        },
      ],
    });
  });

  it("shows and links the newest ready chapter instead of newer unreadable chapters", async () => {
    render(
      <MemoryRouter

        initialEntries={["/student/dashboard/student-1"]}
      >
        <Routes>
          <Route path="/student/dashboard/:studentId" element={<StudentDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ready Story")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ada Student avatar" })).toHaveAttribute(
      "src",
      "/media/avatars/ada-thumbnail.png",
    );
    expect(screen.getByText("Students solve a fictional orbital rescue.")).toBeInTheDocument();
    expect(screen.queryByText("Legacy outline")).not.toBeInTheDocument();
    expect(screen.queryByText("Teacher lesson prompt")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ready Story story preview" })).toHaveAttribute(
      "src",
      "/media/story-images/ready/preview.png",
    );
    expect(screen.getByRole("link", { name: "Read Now" })).toHaveAttribute("href", "/student/story/ready/student-1");
    expect(screen.getByRole("link", { name: "View Classroom" })).toHaveClass("bg-primary");
    expect(screen.queryByText("Still Generating")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed Story")).not.toBeInTheDocument();
    expect(screen.getByText("Grade 5")).toBeInTheDocument();
    expect(screen.queryByText("Grade Grade 5")).not.toBeInTheDocument();
  });
});
