import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentSignup from "./StudentSignup";

const { createStudent, createAvatar } = vi.hoisted(() => ({
  createStudent: vi.fn(),
  createAvatar: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    students: { create: createStudent },
    avatar: { create: createAvatar },
  },
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

describe("StudentSignup", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    createStudent.mockReset().mockResolvedValue({ student: { id: "student-1" } });
    createAvatar.mockReset().mockResolvedValue({ student: { id: "student-1" } });
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
  });

  it("creates a student with an optional disclosed portrait", async () => {
    render(
      <MemoryRouter

        initialEntries={["/student/signup"]}
      >
        <Routes>
          <Route path="/student/signup" element={<StudentSignup />} />
          <Route path="/student/dashboard/:studentId" element={<h1>Student dashboard</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    const portrait = new File(["fictional portrait"], "portrait.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/portrait photo/i), { target: { files: [portrait] } });
    expect(screen.getByText(/sent to Black Forest Labs/i)).toBeInTheDocument();
    expect(screen.getByText(/not kept by EduComic/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/interests/i), { target: { value: "robots" } });
    expect(screen.getByRole("heading", { name: "Create a Student Profile" })).toBeInTheDocument();
    expect(screen.queryByText(/account|log in|sign in/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Profile" }));

    await waitFor(() => expect(createStudent).toHaveBeenCalledWith(
      "Ada Lovelace",
      "robots",
      undefined,
      "11111111-1111-4111-8111-111111111111",
    ));
    expect(createAvatar).toHaveBeenCalledWith("student-1", portrait);
    expect(await screen.findByRole("heading", { name: "Student dashboard" })).toBeInTheDocument();
  });

  it("creates and enrolls through one retry-safe request", async () => {
    sessionStorage.setItem("pendingClassroomId", "22222222-2222-4222-8222-222222222222");
    sessionStorage.setItem("pendingClassroomName", "Fictional Science");
    render(
      <MemoryRouter initialEntries={["/student/signup"]}>
        <Routes><Route path="*" element={<StudentSignup />} /></Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Fiction" } });
    fireEvent.change(screen.getByLabelText(/interests/i), { target: { value: "robots" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Profile & Join Fictional Science/ }));

    await waitFor(() => expect(createStudent).toHaveBeenCalledWith(
      "Ada Fiction",
      "robots",
      "22222222-2222-4222-8222-222222222222",
      "11111111-1111-4111-8111-111111111111",
    ));
  });
});
