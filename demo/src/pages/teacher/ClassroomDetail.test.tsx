import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import ClassroomDetail from "./ClassroomDetail";

const { deleteMaterial, getById, getChapters, getMaterials, updateClassroom, uploadMaterial, leaveClassroom, eraseStudent } = vi.hoisted(() => ({
  deleteMaterial: vi.fn(),
  getById: vi.fn(),
  getChapters: vi.fn(),
  getMaterials: vi.fn(),
  updateClassroom: vi.fn(),
  uploadMaterial: vi.fn(),
  leaveClassroom: vi.fn(),
  eraseStudent: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    classrooms: { getById, getChapters, update: updateClassroom },
    materials: { getAll: getMaterials, upload: uploadMaterial, delete: deleteMaterial },
    students: { leaveClassroom, erase: eraseStudent },
    chapters: { getById: vi.fn(), delete: vi.fn() },
  },
}));

describe("classroom materials", () => {
  beforeEach(() => {
    getById.mockReset().mockResolvedValue({
      success: true,
      classroom: {
        id: "classroom-1",
        name: "Science",
        subject: "Physics",
        grade_level: "8",
        story_theme: "Space",
        design_style: "comic",
        created_at: "2026-07-31T00:00:00Z",
        students: [],
      },
    });
    getChapters.mockReset().mockResolvedValue({ success: true, chapters: [] });
    getMaterials.mockReset().mockResolvedValue({ success: true, materials: [] });
    uploadMaterial.mockReset();
    deleteMaterial.mockReset().mockResolvedValue({ success: true });
    updateClassroom.mockReset().mockRejectedValue(new Error("offline"));
    leaveClassroom.mockReset().mockResolvedValue({ success: true });
    eraseStudent.mockReset().mockResolvedValue({ success: true });
  });

  it("uploads, displays, cancels, and confirms deletion of a ready PDF", async () => {
    uploadMaterial.mockResolvedValue({ success: true, material: {
      id: "material-1", classroom_id: "classroom-1", source_filename: "luma.pdf",
      extraction_state: "ready", content_hash: "a".repeat(64), page_count: 1, text_char_count: 14,
    }});
    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=materials"]}>
        <Routes>
          <Route path="/teacher/classroom/:id" element={<ClassroomDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Science" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Materials" })).toBeInTheDocument();
    const file = new File(["%PDF-fictional"], "luma.pdf", { type: "application/pdf" });
    fireEvent.change(await screen.findByLabelText("Upload lesson PDF"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload and extract" }));

    expect(await screen.findByText("luma.pdf")).toBeInTheDocument();
    expect(screen.getByText("Ready · 1 page · 14 characters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete luma.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteMaterial).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete luma.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm material deletion" }));
    await waitFor(() => expect(deleteMaterial).toHaveBeenCalledWith("material-1"));
    expect(screen.queryByText("luma.pdf")).not.toBeInTheDocument();
  });

  it("shows the truthful textless rejection from extraction", async () => {
    uploadMaterial.mockRejectedValue(new Error("No extractable text was found. Scanned PDFs are not supported yet."));
    render(<MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=materials"]}><Routes><Route path="/teacher/classroom/:id" element={<ClassroomDetail />} /></Routes></MemoryRouter>);
    await screen.findByRole("heading", { name: "Science" });
    fireEvent.change(screen.getByLabelText("Upload lesson PDF"), { target: { files: [new File(["scan"], "scan.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload and extract" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Scanned PDFs are not supported yet");
  });

  it("keeps a failed load visible and retries the classroom", async () => {
    getById
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        success: true,
        classroom: {
          id: "classroom-1",
          name: "Science",
          subject: "Physics",
          grade_level: "8",
          story_theme: "Space",
          design_style: "comic",
          created_at: "2026-07-31T00:00:00Z",
          students: [],
        },
      });

    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1"]}>
        <Routes>
          <Route path="/teacher/classroom/:id" element={<ClassroomDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load classroom");
    expect(screen.queryByText("Classroom not found")).not.toBeInTheDocument();
    expect(screen.queryByText(/No stories yet/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Science" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exposes the invite copy action as a named 44-pixel target", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1"]}>
        <Routes>
          <Route path="/teacher/classroom/:id" element={<ClassroomDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const copyInvite = await screen.findByRole("button", { name: "Copy invite link" });
    expect(copyInvite).toHaveClass("h-11", "min-w-11");
  });

  it("does not offer a Materials link in the real teacher sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1"]}>
        <Routes>
          <Route
            path="/teacher/classroom/:id"
            element={<TeacherSidebar open setOpen={() => undefined} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "Students" })).toHaveLength(2);
    expect(screen.queryAllByRole("link", { name: "Materials" })).toHaveLength(0);
  });

  it("preserves classroom edit values after a recoverable save failure", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=materials"]}>
        <Routes><Route path="/teacher/classroom/:id" element={<ClassroomDetail />} /></Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Science" });

    fireEvent.click(screen.getByRole("button", { name: "Edit classroom" }));
    const name = screen.getByLabelText("Classroom name");
    fireEvent.change(name, { target: { value: "Fictional Physics Lab" } });
    fireEvent.click(screen.getByRole("button", { name: "Save classroom" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(name).toHaveValue("Fictional Physics Lab");
  });

  it("keeps classroom removal distinct and confirmable", async () => {
    getById.mockResolvedValueOnce({ success: true, classroom: {
      id: "classroom-1", name: "Science", subject: "Physics", grade_level: "8", story_theme: "Space", design_style: "comic",
      students: [{ id: "student-1", name: "Mina", interests: "bridges", avatar_url: null, created_at: "2026-08-01T00:00:00Z" }],
    }});
    render(<MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=students"]}><Routes><Route path="/teacher/classroom/:id" element={<ClassroomDetail />} /></Routes></MemoryRouter>);
    await screen.findByText("Mina");

    fireEvent.click(screen.getByRole("button", { name: "Remove Mina from classroom" }));
    expect(leaveClassroom).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm classroom removal" }));
    await waitFor(() => expect(leaveClassroom).toHaveBeenCalledWith("student-1", "classroom-1"));
    expect(eraseStudent).not.toHaveBeenCalled();
  });

  it("explains that full student erasure preserves completed stories", async () => {
    getById.mockResolvedValueOnce({ success: true, classroom: {
      id: "classroom-1", name: "Science", subject: "Physics", grade_level: "8", story_theme: "Space", design_style: "comic",
      students: [{ id: "student-1", name: "Mina", interests: "bridges", avatar_url: null, created_at: "2026-08-01T00:00:00Z" }],
    }});
    render(<MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=students"]}><Routes><Route path="/teacher/classroom/:id" element={<ClassroomDetail />} /></Routes></MemoryRouter>);
    await screen.findByText("Mina");

    fireEvent.click(screen.getByRole("button", { name: "Erase all data for Mina" }));
    expect(screen.getByText(/Completed stories and their artwork remain unchanged/)).toBeInTheDocument();
    expect(eraseStudent).not.toHaveBeenCalled();
  });

  it("uses portrait thumbnails in the student roster", async () => {
    getById.mockResolvedValueOnce({ success: true, classroom: {
      id: "classroom-1", name: "Science", subject: "Physics", grade_level: "8", story_theme: "Space", design_style: "comic",
      students: [{
        id: "student-1",
        name: "Mina",
        interests: "bridges",
        avatar_url: "/media/avatars/mina-full.png",
        avatar_thumbnail_url: "/media/avatars/mina-thumbnail.png",
        created_at: "2026-08-01T00:00:00Z",
      }],
    }});
    render(<MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=students"]}><Routes><Route path="/teacher/classroom/:id" element={<ClassroomDetail />} /></Routes></MemoryRouter>);

    await screen.findByText("Mina");
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("img", { name: "Mina avatar" })).toHaveAttribute(
      "src",
      "/media/avatars/mina-thumbnail.png",
    );
  });

  it("opens a completed story through the client router", async () => {
    getChapters.mockResolvedValueOnce({
      success: true,
      chapters: [{
        id: "chapter-1",
        classroom_id: "classroom-1",
        index: 1,
        revision: 1,
        chapter_outline: null,
        original_prompt: "Teach condensation",
        thumbnail_url: null,
        story_title: "The Misty Jar",
        story_description: "A class investigates condensation.",
        status: "ready",
        created_at: "2026-08-01T00:00:00Z",
      }],
    });

    render(
      <MemoryRouter initialEntries={["/teacher/classroom/classroom-1?tab=stories"]}>
        <Routes>
          <Route path="/teacher/classroom/:id" element={<ClassroomDetail />} />
          <Route path="/teacher/story/:id" element={<h1>Story route loaded</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("link", { name: "View Chapter" }));

    expect(await screen.findByRole("heading", { name: "Story route loaded" })).toBeInTheDocument();
  });
});
