import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentLogin from "./StudentLogin";

const { getAllStudents } = vi.hoisted(() => ({ getAllStudents: vi.fn() }));

vi.mock("@/lib/api", () => ({
  api: { students: { getAll: getAllStudents } },
}));
vi.mock("@/components/shared/DemoBanner", () => ({
  DemoBanner: () => <div role="status" aria-label="Public demo">Public demo · Fictional data · Read-only</div>,
}));

const LocationProbe = () => <output aria-label="Current path">{useLocation().pathname}</output>;

const renderLogin = () => render(
  <MemoryRouter initialEntries={["/student/select"]}>
    <LocationProbe />
    <Routes><Route path="*" element={<StudentLogin />} /></Routes>
  </MemoryRouter>,
);

describe("StudentLogin", () => {
  beforeEach(() => {
    getAllStudents.mockReset();
    localStorage.clear();
  });

  it("keeps a failed load visible and retries it", async () => {
    getAllStudents
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ students: [] });

    renderLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load students");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(getAllStudents).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No student profiles found")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses truthful local-profile language and a focusable named button", async () => {
    getAllStudents.mockResolvedValue({
      students: [{
        id: "student-1",
        name: "Ada",
        interests: "Robotics",
        avatar_url: "/media/avatars/ada-full.png",
        avatar_thumbnail_url: "/media/avatars/ada-thumbnail.png",
        created_at: "2026-01-01",
      }],
    });

    renderLogin();

    expect(screen.getByRole("heading", { name: "Choose a Student Profile" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Public demo" })).toBeInTheDocument();
    expect(screen.queryByText("This selects a local preview only. It does not authenticate anyone.")).not.toBeInTheDocument();
    expect(screen.queryByText(/account|log in|sign in/i)).not.toBeInTheDocument();
    const profile = await screen.findByRole("button", { name: /Continue as Ada/ });
    expect(screen.getByRole("img", { name: "Ada" })).toHaveAttribute(
      "src",
      "/media/avatars/ada-thumbnail.png",
    );
    expect(profile.tagName).toBe("BUTTON");
    profile.focus();
    expect(profile).toHaveFocus();
    fireEvent.click(profile);

    expect(localStorage.getItem("studentId")).toBe("student-1");
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/student/dashboard/student-1");
  });
});
