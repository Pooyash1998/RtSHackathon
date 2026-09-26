import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StudentLayout } from "./student/StudentLayout";
import { TeacherLayout } from "./teacher/TeacherLayout";

vi.mock("@/components/shared/DemoBanner", () => ({
  DemoBanner: () => <div role="status" aria-label="Public demo">Public demo · Fictional data · Read-only</div>,
}));

describe("responsive app layouts", () => {
  it("keeps teacher navigation targets fluid while centering their icons when collapsed", () => {
    render(
      <MemoryRouter initialEntries={["/teacher/settings"]}>
        <TeacherLayout>Teacher content</TeacherLayout>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "Settings" })[0]).toHaveClass(
      "w-full",
      "justify-center",
      "px-0",
    );
    expect(screen.getAllByRole("link", { name: "Settings" })[0]).not.toHaveClass(
      "left-1/2",
      "w-11",
      "-translate-x-1/2",
    );
  });

  it("labels the local teacher exit without implying authentication", () => {
    render(
      <MemoryRouter initialEntries={["/teacher/settings"]}>
        <TeacherLayout>Teacher content</TeacherLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Exit Teacher View" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "EduComic dashboard" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Settings" })[0]).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText(/StoryClass/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /log\s*out/i })).not.toBeInTheDocument();
  });

  it.each([
    ["teacher", TeacherLayout, "Teacher content"],
    ["student", StudentLayout, "Student content"],
  ])("stacks the %s sidebar above content on mobile and beside it on desktop", (_name, Layout, content) => {
    render(
      <MemoryRouter>
        <Layout>{content}</Layout>
      </MemoryRouter>,
    );

    const banner = screen.getByRole("status", { name: "Public demo" });
    expect(banner).toHaveTextContent("Public demo · Fictional data · Read-only");
    expect(banner.parentElement).toHaveClass("h-screen", "overflow-hidden");
    expect(screen.getByText(content).parentElement).toHaveClass("flex-col", "md:flex-row");
  });
});
