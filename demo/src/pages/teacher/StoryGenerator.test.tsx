import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StoryGenerator from "./StoryGenerator";

const { chooseIdea, commitChapter, discardGeneration, getChapter, getClassroom, getMaterials, resumeGeneration, retryPreview, startChapter } = vi.hoisted(() => ({
  chooseIdea: vi.fn(),
  commitChapter: vi.fn(),
  getChapter: vi.fn(),
  getClassroom: vi.fn(),
  getMaterials: vi.fn(),
  resumeGeneration: vi.fn(),
  discardGeneration: vi.fn(),
  retryPreview: vi.fn(),
  startChapter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    classrooms: {
      getById: getClassroom,
    },
    materials: { getAll: getMaterials },
    story: {
      startChapter,
      chooseIdea,
      commitChapter,
      retryPreview,
    },
    chapters: { getById: getChapter },
    generationRuns: { resume: resumeGeneration, discard: discardGeneration },
  },
}));

const chapterResponse = (status: string, panels: unknown[] = []) => ({
  success: true,
  chapter: { id: "chapter-1", status, panels },
});

const renderGenerator = (initialEntry = "/teacher/classroom/classroom-1/story/new") => render(
  <MemoryRouter

    initialEntries={[initialEntry]}
  >
    <Routes>
      <Route path="/teacher/classroom/:classroomId/story/new" element={<StoryGenerator />} />
    </Routes>
  </MemoryRouter>,
);

const startGeneration = async (fakeTimers = false) => {
  startChapter.mockResolvedValue({
    success: true,
    chapter: {
      id: "chapter-1",
      story_ideas: [{ id: "idea_1", title: "Orbit", summary: "A lesson", theme: "Space" }],
    },
  });
  commitChapter.mockResolvedValue({ success: true });

  renderGenerator();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));
  const selectButton = await screen.findByRole("button", { name: "Select This Story" });
  if (fakeTimers) vi.useFakeTimers();
  fireEvent.click(selectButton);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("StoryGenerator", () => {
  beforeEach(() => {
    startChapter.mockReset();
    chooseIdea.mockReset().mockResolvedValue({ success: true });
    commitChapter.mockReset();
    getChapter.mockReset();
    getClassroom.mockReset().mockResolvedValue({
      success: true,
      classroom: { name: "Science", subject: "Physics", grade_level: "8" },
    });
    getMaterials.mockReset().mockResolvedValue({ success: true, materials: [] });
    retryPreview.mockReset();
    resumeGeneration.mockReset().mockResolvedValue({ run_id: "run-1", status: "generating" });
    discardGeneration.mockReset().mockResolvedValue({ success: true, run_id: "run-1" });
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a retryable error instead of mock choices when option generation fails", async () => {
    startChapter.mockRejectedValue(new Error("Service unavailable"));

    renderGenerator();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
    expect(screen.queryByText("Newton's Space Race")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select This Story" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Generate Story Options" })).toBeEnabled());
  });

  it("sends only explicitly selected ready materials and shows grounded metadata", async () => {
    getMaterials.mockResolvedValue({ success: true, materials: [{
      id: "material-1", classroom_id: "classroom-1", source_filename: "luma.pdf",
      extraction_state: "ready", content_hash: "a".repeat(64), page_count: 1, text_char_count: 14,
    }] });
    startChapter.mockResolvedValue({ success: true, chapter: {
      id: "chapter-1", story_ideas: [{ id: "idea_1", title: "Luma", summary: "A lesson", theme: "Space" }],
      grounded_sources: [{ material_id: "material-1", content_hash: "a".repeat(64), source_label: "luma.pdf", excerpts: [{ page: 1, text: "Luma is blue." }] }],
    }});

    renderGenerator();
    fireEvent.change(await screen.findByRole("textbox"), { target: { value: "Teach moons" } });
    fireEvent.click(await screen.findByRole("checkbox", { name: "Use luma.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));

    await waitFor(() => expect(startChapter).toHaveBeenCalledWith("classroom-1", "Teach moons", ["material-1"]));
    expect(await screen.findByText("Grounded in luma.pdf")).toBeInTheDocument();
  });

  it("keeps a failed classroom metadata load visible and retries it", async () => {
    getClassroom
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        success: true,
        classroom: { name: "Science", subject: "Physics", grade_level: "8" },
      });

    renderGenerator();

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load classroom details");
    fireEvent.click(screen.getByRole("button", { name: "Retry classroom details" }));

    expect(await screen.findByText(/Physics.*8/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders and selects story options without a thumbnail request", async () => {
    startChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        story_ideas: [{ id: "idea_1", title: "Orbit", summary: "A lesson", theme: "Space" }],
      },
    });
    commitChapter.mockResolvedValue({ success: true });
    getChapter.mockResolvedValue(chapterResponse("failed"));

    renderGenerator();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));

    expect(await screen.findByText("Orbit")).toBeInTheDocument();
    expect(screen.getByText("Space")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select This Story" }));

    await waitFor(() => expect(chooseIdea).toHaveBeenCalledWith("chapter-1", "idea_1"));
    expect(fetch).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it("shows a durable local idea preview and keeps the complete summary readable", async () => {
    const summary = "Students repair a tumbling satellite, compare forces, and use evidence from the lesson to settle on a safe orbit.";
    startChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        story_ideas: [{
          id: "idea_1",
          title: "The Orbit Workshop",
          summary,
          theme: "Space",
          preview_status: "ready",
          preview_url: "/media/story-images/chapter-1/preview.png",
        }],
      },
    });

    renderGenerator();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));

    expect(await screen.findByText(summary)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "The Orbit Workshop story preview" })).toHaveAttribute(
      "src",
      "/media/story-images/chapter-1/preview.png",
    );
  });

  it("resumes paid story options from their durable chapter after a refresh", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        classroom_id: "classroom-1",
        status: "options_generated",
        original_prompt: "Teach orbits",
        story_ideas: [{
          id: "idea_1",
          title: "The Orbit Workshop",
          summary: "A complete durable story direction.",
          theme: "Space",
          preview_status: "ready",
          preview_url: "/media/story-images/chapter-1/preview.png",
        }],
        grounded_sources: [],
        panels: [],
      },
    });

    renderGenerator("/teacher/classroom/classroom-1/story/new?chapter=chapter-1");

    expect(await screen.findByText("A complete durable story direction.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "The Orbit Workshop story preview" })).toHaveAttribute(
      "src",
      "/media/story-images/chapter-1/preview.png",
    );
  });

  it("retries only a failed preview without blocking story selection", async () => {
    const failedIdea = {
      id: "idea_1", title: "Orbit", summary: "A lesson", theme: "Space",
      preview_status: "failed", preview_url: null,
    };
    startChapter.mockResolvedValue({
      success: true,
      chapter: { id: "chapter-1", story_ideas: [failedIdea] },
    });
    retryPreview.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        story_ideas: [{ ...failedIdea, preview_status: "generating" }],
      },
    });

    renderGenerator();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retry Orbit preview" }));

    await waitFor(() => expect(retryPreview).toHaveBeenCalledWith("chapter-1", "idea_1"));
    expect(chooseIdea).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Select This Story" })).toBeEnabled();
    expect(screen.getByText("Creating preview…")).toBeInTheDocument();
  });

  it("retries an ambiguous commit directly with the same idempotency key", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000002");
    startChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        story_ideas: [{ id: "idea_1", title: "Orbit", summary: "A lesson", theme: "Space" }],
      },
    });
    commitChapter
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce({ success: true });
    getChapter.mockResolvedValue(chapterResponse("generating"));

    renderGenerator();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Newton's laws" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Story Options" }));
    fireEvent.click(await screen.findByRole("button", { name: "Select This Story" }));
    await waitFor(() => expect(commitChapter).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole("button", { name: "Select This Story" }));
    await waitFor(() => expect(commitChapter).toHaveBeenCalledTimes(2));

    expect(chooseIdea).toHaveBeenCalledTimes(1);
    expect(chooseIdea.mock.invocationCallOrder[0]).toBeLessThan(commitChapter.mock.invocationCallOrder[0]);
    expect(commitChapter.mock.calls.map((call) => call[2])).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000001",
    ]);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("rotates the idempotency key after an observed terminal failure", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000002");
    getChapter.mockResolvedValue(chapterResponse("failed"));

    await startGeneration();
    fireEvent.click(await screen.findByRole("button", { name: "Try another story" }));
    fireEvent.click(screen.getByRole("button", { name: "Select This Story" }));
    await waitFor(() => expect(commitChapter).toHaveBeenCalledTimes(2));

    expect(commitChapter.mock.calls.map((call) => call[2])).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  it("resets the consecutive polling failure limit after a successful poll", async () => {
    getChapter.mockRejectedValueOnce(new Error("offline"));
    getChapter.mockResolvedValueOnce(chapterResponse("generating"));
    for (let attempt = 0; attempt < 10; attempt += 1) {
      getChapter.mockRejectedValueOnce(new Error("offline"));
    }

    await startGeneration(true);

    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(screen.getByRole("alert")).toHaveTextContent("Lost connection");
  });

  it("stops polling and offers a retry when generation fails", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        status: "failed",
        panels: [],
        generation_failure: {
          error_code: "bfl_content_moderated",
          error_reference: "safe-reference",
          panel_number: 6,
        },
      },
    });

    await startGeneration(true);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "BFL blocked panel 6 during moderation. EduComic stopped without submitting an automatic retry."
    );
    expect(screen.getByRole("button", { name: "Try another story" })).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(4_000));
    expect(getChapter).toHaveBeenCalledTimes(1);
  });

  it("shows saved paid work and explicitly resumes the failed run", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        status: "failed",
        panels: [],
        temporary_panel_previews: [
          { index: 1, image: "/media/one.png" },
          { index: 2, image: "/media/two.png" },
        ],
        generation_failure: {
          run_id: "run-1",
          error_code: "bfl_content_moderated",
          error_reference: "safe-reference",
          panel_number: 3,
          completed_panels: 2,
          expected_panels: 12,
          reported_bfl_cost: 4.5,
          resumable: true,
        },
      },
    });

    await startGeneration(true);

    expect(screen.getByText("2 of 12 panels preserved")).toBeInTheDocument();
    expect(screen.getByText("BFL reported cost: 4.5")).toBeInTheDocument();
    const resume = screen.getByRole("button", { name: "Resume from panel 3" });
    fireEvent.click(resume);
    await act(async () => Promise.resolve());
    expect(resumeGeneration).toHaveBeenCalledWith("run-1");
  });

  it("requires confirmation before discarding saved paid work", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        status: "failed",
        panels: [],
        generation_failure: {
          run_id: "run-1",
          error_code: "bfl_content_moderated",
          panel_number: 3,
          completed_panels: 2,
          expected_panels: 12,
          reported_bfl_cost: 4.5,
          resumable: true,
        },
      },
    });
    vi.stubGlobal("confirm", vi.fn(() => true));

    await startGeneration(true);
    fireEvent.click(screen.getByRole("button", { name: "Discard saved attempt" }));

    await act(async () => Promise.resolve());
    expect(discardGeneration).toHaveBeenCalledWith("run-1");
    expect(screen.getByRole("button", { name: "Select This Story" })).toBeInTheDocument();
  });

  it("shows panel progress without inventing an expected panel count", async () => {
    getChapter.mockResolvedValue(chapterResponse("generating", [{
      id: "panel-1",
      chapter_id: "chapter-1",
      index: 1,
      image: "panel.png",
      created_at: "2026-07-31T00:00:00Z",
    }]));

    await startGeneration();

    expect(screen.getByText("1 panel completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveClass("animate-pulse");
    expect(screen.queryByText(/\/ 12/)).not.toBeInTheDocument();
  });

  it("shows durable temporary panel images while the final revision is still generating", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "chapter-1",
        status: "generating",
        panels: [],
        temporary_panel_previews: [{ index: 1, image: "/media/story-images/chapter-1/panel-1.png" }],
      },
    });

    await startGeneration();

    expect(screen.getByText("1 panel completed")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Generated panel 1 preview" })).toHaveAttribute(
      "src",
      "/media/story-images/chapter-1/panel-1.png",
    );
  });
});
