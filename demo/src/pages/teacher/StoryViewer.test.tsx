import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StoryViewer from "./StoryViewer";

const { acceptPanelRegeneration, getChapter, getChapters, regeneratePanel, getPanelRegeneration, rejectPanelRegeneration } = vi.hoisted(() => ({
  acceptPanelRegeneration: vi.fn(),
  getChapter: vi.fn(),
  getChapters: vi.fn(),
  regeneratePanel: vi.fn(),
  getPanelRegeneration: vi.fn(),
  rejectPanelRegeneration: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    chapters: { getById: getChapter, regeneratePanel, getPanelRegeneration, acceptPanelRegeneration, rejectPanelRegeneration },
    classrooms: { getChapters },
  },
}));

const LocationProbe = () => <output aria-label="Current path">{useLocation().pathname}</output>;

const renderViewer = () => render(
  <MemoryRouter

    initialEntries={["/teacher/story/current"]}
  >
    <LocationProbe />
    <Routes>
      <Route path="/teacher/story/:id" element={<StoryViewer />} />
    </Routes>
  </MemoryRouter>,
);

describe("StoryViewer", () => {
  beforeEach(() => {
    getChapter.mockReset();
    getChapters.mockReset();
    regeneratePanel.mockReset();
    getPanelRegeneration.mockReset();
    acceptPanelRegeneration.mockReset().mockResolvedValue({ run_id: "run-1", status: "ready" });
    rejectPanelRegeneration.mockReset().mockResolvedValue({ run_id: "run-1", status: "ready" });
    localStorage.clear();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("exposes reader controls and clamps a malformed saved scale", async () => {
    localStorage.setItem("teacherStoryReaderImageScale", "not-a-number");
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1, chapter_outline: null,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01", panels: [],
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });

    renderViewer();

    const slider = await screen.findByRole("slider", { name: "Image size" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuetext", "50 percent");
    expect(screen.getByRole("button", { name: "Vertical layout" })).toHaveAttribute("aria-pressed", "true");
    const grid = screen.getByRole("button", { name: "Grid layout" });
    fireEvent.click(grid);
    expect(grid).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the exact PDF page used to ground the story", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01", panels: [],
        grounded_sources: [{
          material_id: "material-1", content_hash: "a".repeat(64), source_label: "weather.pdf",
          excerpts: [{ page: 4, text: "Water vapor condenses." }],
        }],
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });

    renderViewer();

    expect(await screen.findByLabelText("Lesson sources")).toHaveTextContent("weather.pdf");
    expect(screen.getByLabelText("Lesson sources")).toHaveTextContent("Page 4");
  });

  it("fails closed when a chapter is not ready", async () => {
    getChapter.mockResolvedValueOnce({
      success: true,
      chapter: {
        id: "current",
        classroom_id: "classroom-1",
        index: 1,
        story_title: "Unfinished Story",
        status: "generating",
        panels: [],
      },
    }).mockImplementation(() => new Promise(() => {}));

    renderViewer();

    expect(await screen.findByRole("alert")).toHaveTextContent("generating");
    expect(screen.queryByText("Unfinished Story")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export PDF" })).not.toBeInTheDocument();
    expect(getChapters).not.toHaveBeenCalled();
  });

  it("navigates only between ready chapters", async () => {
    getChapter.mockResolvedValueOnce({
      success: true,
      chapter: {
        id: "current",
        classroom_id: "classroom-1",
        index: 2,
        story_title: "Current Story",
        status: "ready",
        panels: [],
      },
    }).mockImplementation(() => new Promise(() => {}));
    getChapters.mockResolvedValue({
      success: true,
      chapters: [
        { id: "generating", status: "generating", created_at: "2026-07-31T04:00:00Z" },
        { id: "current", status: "ready", created_at: "2026-07-31T03:00:00Z" },
        { id: "failed", status: "failed", created_at: "2026-07-31T02:00:00Z" },
        { id: "older-ready", status: "ready", created_at: "2026-07-31T01:00:00Z" },
      ],
    });

    renderViewer();

    fireEvent.click(await screen.findByRole("button", { name: "Previous Story" }));
    await waitFor(() => expect(screen.getByLabelText("Current path")).toHaveTextContent("/teacher/story/older-ready"));
  });

  it("reuses the same idempotency key when the initial request outcome is unknown", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01",
        panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel
      .mockRejectedValueOnce(new Error("fictional transport failure"))
      .mockResolvedValueOnce({ run_id: "run-1", status: "failed", error_reference: "ref-1" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(screen.getByRole("img", { name: "Original panel 2" })).toHaveAttribute("src", "/media/old.png");
    expect(await screen.findByRole("alert")).toHaveTextContent("status could not be confirmed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("previous panel is still available");
    const firstKey = regeneratePanel.mock.calls[0][4];
    fireEvent.click(screen.getByRole("button", { name: "Check panel 2 status" }));
    await waitFor(() => expect(regeneratePanel).toHaveBeenCalledTimes(2));
    expect(regeneratePanel.mock.calls[1][4]).toBe(firstKey);
    expect(await screen.findByRole("alert")).toHaveTextContent("previous panel is still available");
    expect(screen.getByRole("textbox", { name: "Correction for panel 2" })).toHaveValue("Make the arrow clockwise.");
  });

  it("resumes polling a known run without submitting a second correction", async () => {
    const chapter = {
      id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
      original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
      created_at: "2026-01-01",
      panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
    };
    getChapter
      .mockResolvedValueOnce({ success: true, chapter })
      .mockResolvedValueOnce({
        success: true,
        chapter: { ...chapter, revision: 2, panels: [{ ...chapter.panels[0], image: "/media/replacement.png" }] },
      });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({ run_id: "run-1", status: "regenerating" });
    getPanelRegeneration
      .mockRejectedValueOnce(new Error("fictional poll interruption"))
      .mockResolvedValueOnce({ run_id: "run-1", status: "ready" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("status could not be confirmed");
    fireEvent.click(screen.getByRole("button", { name: "Check panel 2 status" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Panel 2" })).toHaveAttribute("src", "/media/replacement.png"));
    expect(regeneratePanel).toHaveBeenCalledTimes(1);
    expect(getPanelRegeneration).toHaveBeenNthCalledWith(1, "run-1");
    expect(getPanelRegeneration).toHaveBeenNthCalledWith(2, "run-1");
  });

  it("treats a polling timeout as unknown instead of failed", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01",
        panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({ run_id: "run-1", status: "regenerating" });
    getPanelRegeneration.mockResolvedValue({ run_id: "run-1", status: "regenerating" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));
    await act(async () => vi.advanceTimersByTimeAsync(120_000));

    expect(screen.getByRole("alert")).toHaveTextContent("status could not be confirmed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("previous panel is still available");
    expect(getPanelRegeneration).toHaveBeenCalledTimes(300);
  });

  it("starts a new attempt only after a persisted failure", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01",
        panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({ run_id: "run-1", status: "failed", error_reference: "ref-1" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("previous panel is still available");
    const firstKey = regeneratePanel.mock.calls[0][4];
    fireEvent.click(screen.getByRole("button", { name: "Retry panel 2" }));
    await waitFor(() => expect(regeneratePanel).toHaveBeenCalledTimes(2));
    expect(regeneratePanel.mock.calls[1][4]).not.toBe(firstKey);
  });

  it("reports a completed correction separately when refreshing the story fails", async () => {
    const chapter = {
      id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
      original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
      created_at: "2026-01-01",
      panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
    };
    getChapter
      .mockResolvedValueOnce({ success: true, chapter })
      .mockRejectedValueOnce(new Error("fictional refresh failure"))
      .mockResolvedValueOnce({
        success: true,
        chapter: { ...chapter, revision: 2, panels: [{ ...chapter.panels[0], image: "/media/replacement.png" }] },
      });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({ run_id: "run-1", status: "ready" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("correction completed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("previous panel is still available");
    expect(screen.queryByRole("button", { name: "Retry panel 2" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload story" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Panel 2" })).toHaveAttribute("src", "/media/replacement.png"));
    expect(regeneratePanel).toHaveBeenCalledTimes(1);
  });

  it("shows progress over the old panel then reloads the published replacement", async () => {
    const chapter = {
      id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
      original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
      created_at: "2026-01-01",
      panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
    };
    getChapter
      .mockResolvedValueOnce({ success: true, chapter })
      .mockResolvedValueOnce({
        success: true,
        chapter: {
          ...chapter,
          revision: 2,
          panels: [{ ...chapter.panels[0], image: "/media/replacement.png" }],
        },
      });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({ run_id: "run-1", status: "regenerating" });
    getPanelRegeneration.mockResolvedValue({ run_id: "run-1", status: "ready" });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(await screen.findByText("Regenerating panel 2...")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Original panel 2" })).toHaveAttribute("src", "/media/old.png");
    await waitFor(
      () => expect(screen.getByRole("img", { name: "Panel 2" })).toHaveAttribute("src", "/media/replacement.png"),
      { timeout: 2000 },
    );
    expect(getPanelRegeneration).toHaveBeenCalledWith("run-1");
  });

  it("holds a generated candidate beside the original until the teacher accepts it", async () => {
    const chapter = {
      id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
      original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
      created_at: "2026-01-01",
      panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
    };
    getChapter
      .mockResolvedValueOnce({ success: true, chapter })
      .mockResolvedValueOnce({
        success: true,
        chapter: { ...chapter, revision: 2, panels: [{ ...chapter.panels[0], image: "/media/replacement.png" }] },
      });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({
      run_id: "run-1", status: "candidate_ready", candidate_url: "/media/candidate.png",
    });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));

    expect(await screen.findByRole("img", { name: "Original panel 2" })).toHaveAttribute("src", "/media/old.png");
    expect(screen.getByRole("img", { name: "Candidate panel 2" })).toHaveAttribute("src", "/media/candidate.png");
    fireEvent.click(screen.getByRole("button", { name: "Accept replacement" }));
    await waitFor(() => expect(acceptPanelRegeneration).toHaveBeenCalledWith("run-1"));
    await waitFor(() => expect(screen.getByRole("img", { name: "Panel 2" })).toHaveAttribute("src", "/media/replacement.png"));
  });

  it("restores an awaiting candidate after the page reloads", async () => {
    getChapter.mockResolvedValue({
      success: true,
      chapter: {
        id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
        original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
        created_at: "2026-01-01",
        panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
        panel_regeneration_candidate: {
          run_id: "run-1", panel_number: 2, candidate_url: "/media/candidate.png", reported_bfl_cost: 3.25,
        },
      },
    });
    getChapters.mockResolvedValue({ success: true, chapters: [] });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Review replacement for panel 2" }));

    expect(screen.getByRole("img", { name: "Candidate panel 2" })).toHaveAttribute("src", "/media/candidate.png");
    expect(screen.getByText("BFL reported cost: 3.25")).toBeInTheDocument();
  });

  it("keeps the original when the teacher rejects a generated candidate", async () => {
    const chapter = {
      id: "current", classroom_id: "classroom-1", index: 1, revision: 1,
      original_prompt: "Lesson", thumbnail_url: null, story_title: "Gravity", status: "ready",
      created_at: "2026-01-01",
      panels: [{ id: "panel-2", chapter_id: "current", index: 2, image: "/media/old.png", created_at: "2026-01-01" }],
    };
    getChapter.mockResolvedValue({ success: true, chapter });
    getChapters.mockResolvedValue({ success: true, chapters: [] });
    regeneratePanel.mockResolvedValue({
      run_id: "run-1", status: "candidate_ready", candidate_url: "/media/candidate.png",
    });

    renderViewer();
    fireEvent.click(await screen.findByRole("button", { name: "Correct panel 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correction for panel 2" }), {
      target: { value: "Make the arrow clockwise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate replacement" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep original" }));

    await waitFor(() => expect(rejectPanelRegeneration).toHaveBeenCalledWith("run-1"));
    expect(screen.getByRole("img", { name: "Panel 2" })).toHaveAttribute("src", "/media/old.png");
  });
});
