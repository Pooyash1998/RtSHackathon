import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentClassroom from "./StudentClassroom";

const { getChapters, getClassroom } = vi.hoisted(() => ({
  getChapters: vi.fn(),
  getClassroom: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    classrooms: {
      getById: getClassroom,
      getChapters,
    },
  },
}));

const classroomResponse = {
  success: true,
  classroom: {
    id: "classroom-1",
    name: "Physics Lab",
    subject: "Physics",
    grade_level: "8",
    story_theme: "Space",
    design_style: "comic",
    created_at: "2026-07-31T00:00:00Z",
    students: [],
  },
};

describe("StudentClassroom", () => {
  beforeEach(() => {
    getClassroom.mockReset();
    getChapters.mockReset().mockResolvedValue({ success: true, chapters: [] });
  });

  it("keeps a failed load visible and retries it", async () => {
    getClassroom
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(classroomResponse);

    render(
      <MemoryRouter

        initialEntries={["/student/classroom/classroom-1/student-1"]}
      >
        <Routes>
          <Route path="/student/classroom/:classroomId/:studentId" element={<StudentClassroom />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load classroom");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Physics Lab" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses portrait thumbnails for the class picture", async () => {
    getClassroom.mockResolvedValue({
      ...classroomResponse,
      classroom: {
        ...classroomResponse.classroom,
        students: [{
          id: "student-1",
          name: "Mina",
          interests: "Bridges",
          avatar_url: "/media/avatars/mina-full.png",
          avatar_thumbnail_url: "/media/avatars/mina-thumbnail.png",
          created_at: "2026-07-31T00:00:00Z",
        }],
      },
    });

    render(
      <MemoryRouter

        initialEntries={["/student/classroom/classroom-1/student-1"]}
      >
        <Routes>
          <Route path="/student/classroom/:classroomId/:studentId" element={<StudentClassroom />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("img", { name: "Mina avatar" })).toHaveAttribute(
      "src",
      "/media/avatars/mina-thumbnail.png",
    );
  });
});
