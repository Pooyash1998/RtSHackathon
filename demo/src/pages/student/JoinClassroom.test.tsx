import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import JoinClassroom from "./JoinClassroom";

describe("JoinClassroom", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a loading state while a direct invite is being fetched", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(
      <MemoryRouter

        initialEntries={["/student/join/classroom-123"]}
      >
        <Routes>
          <Route path="/student/join/:classroomCode" element={<JoinClassroom />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status", { name: "Loading classroom" })).toBeInTheDocument();
    expect(screen.queryByText(/join null/i)).not.toBeInTheDocument();
  });
});
