import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Settings from "./Settings";

const { get, update, reset } = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: { settings: { get, update, reset } } }));

beforeEach(() => {
  get.mockReset().mockResolvedValue({
    settings: {
      story_length: 12,
      default_design_style: "comic",
      openai_model: "gpt-5.6-terra",
      bfl_model: "flux-2-pro",
      automatic_panel_review: false,
      panel_review_attempt_cap: 3,
      reader_preferences: {},
    },
    provider_readiness: { openai: false, bfl: true },
    local_data: "Stored only on this device",
  });
  update.mockReset().mockResolvedValue({ success: true });
  reset.mockReset().mockResolvedValue({ success: true });
});

it("persists a full-comic choice without showing secrets or local paths", async () => {
  render(<MemoryRouter><Settings /></MemoryRouter>);

  expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(screen.getByText("Stored only on this device")).toBeInTheDocument();
  expect(screen.queryByText(/C:\\|OPENAI_API_KEY|BFL_API_KEY/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("20 panels (Full comic)"));
  fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

  await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ story_length: 20 })));
});

it("explains and saves a current OpenAI model choice", async () => {
  render(<MemoryRouter><Settings /></MemoryRouter>);
  await screen.findByRole("heading", { name: "Settings" });

  expect(screen.getByText(/balanced cost and quality/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("OpenAI model"), { target: { value: "gpt-5.6-sol" } });
  fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

  await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ openai_model: "gpt-5.6-sol" })));
});

it("explains the paid review retry cost and saves the optional Flex model", async () => {
  render(<MemoryRouter><Settings /></MemoryRouter>);
  await screen.findByRole("heading", { name: "Settings" });

  expect(screen.getByText(/enabling review adds one OpenAI vision review for every initial panel/i)).toBeInTheDocument();
  expect(screen.getByText(/each retry adds another BFL image generation and another OpenAI vision review/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("BFL model"), { target: { value: "flux-2-flex" } });
  fireEvent.click(screen.getByLabelText("Automatically review generated panels"));
  fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

  await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({
    bfl_model: "flux-2-flex", automatic_panel_review: true,
  })));
});

it("requires a confirmation dialog before resetting local data", async () => {
  render(<MemoryRouter><Settings /></MemoryRouter>);
  await screen.findByRole("heading", { name: "Settings" });

  fireEvent.click(screen.getByRole("button", { name: "Reset local data" }));
  expect(reset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

  await waitFor(() => expect(reset).toHaveBeenCalledOnce());
});
