import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Panel } from "@/types/story";
import { exportStoryPdf } from "./exportStoryPdf";

const { addImage, save } = vi.hoisted(() => ({ addImage: vi.fn(), save: vi.fn() }));

vi.mock("jspdf", async () => {
  const actual = await vi.importActual<typeof import("jspdf")>("jspdf");
  return {
    ...actual,
    jsPDF: class {
      constructor(options: ConstructorParameters<typeof actual.jsPDF>[0]) {
        const doc = new actual.jsPDF(options);
        const realAddImage = doc.addImage.bind(doc);
        doc.addImage = addImage.mockImplementation((...args) => realAddImage(...args));
        doc.save = save;
        return doc;
      }
    },
  };
});

const panel = (index: number, extension = "png"): Panel => ({
  id: `panel-${index}`,
  chapter_id: "chapter-1",
  index,
  image: `https://cdn.example.invalid/panel-${index}.${extension}`,
  created_at: "2026-07-31T00:00:00Z",
});

const bytes = (base64: string) => Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
const png = bytes("iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAARSURBVBhXY0iZ+vY/DDMgcwDbZRFf6QO86QAAAABJRU5ErkJggg==");
const jpeg = bytes("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAACAAMDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDq6KKK/os/Kj//2Q==");

const response = (data: Uint8Array, mime: string) => ({
  ok: true,
  headers: new Headers({ "content-type": mime }),
  arrayBuffer: () => Promise.resolve(data.buffer),
});

describe("exportStoryPdf", () => {
  beforeEach(() => {
    addImage.mockReset();
    save.mockReset();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 3, height: 2, close: vi.fn() }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["PNG", png, "image/png", "png"],
    ["JPEG", jpeg, "image/jpeg", "jpg"],
  ])("embeds verified %s bytes using the real jsPDF decoder", async (format, data, mime, extension) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(data, mime)));

    await exportStoryPdf({ panels: [panel(1, extension)], title: "Safe story" });

    expect(addImage.mock.calls[0][0]).toEqual(data);
    expect(addImage.mock.calls[0][1]).toBe(format);
    expect(save).toHaveBeenCalledWith("Safe story.pdf");
  });

  it.each([
    [2, [10, 14.67, 190, 126.67]],
    [4, [10, 47.17, 92.5, 61.67]],
  ] as const)("preserves a 3:2 panel ratio in a %s-up layout", async (panelsPerPage, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(png, "image/png")));

    await exportStoryPdf({ panels: [panel(1)], title: "Ratio", panelsPerPage });

    addImage.mock.calls[0].slice(2, 6).forEach((value, index) => {
      expect(value).toBeCloseTo(expected[index], 1);
    });
  });

  it.each([
    ["header-only", new Uint8Array([255, 216, 255])],
    ["truncated after its dimensions", jpeg.slice(0, -2)],
  ])("rejects a %s JPEG without saving", async (_case, data) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(data, "image/jpeg")));

    await expect(exportStoryPdf({ panels: [panel(1, "jpg")], title: "Unsafe story" })).rejects.toThrow();

    expect(addImage).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    ["failed response", { ok: false, headers: new Headers(), arrayBuffer: vi.fn() }],
    ["invalid image", response(new Uint8Array([1, 2, 3]), "image/png")],
    ["unsupported image type", response(png, "image/svg+xml")],
  ])("rejects a %s without saving", async (_case, remoteResponse) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(remoteResponse));

    await expect(exportStoryPdf({ panels: [panel(1)], title: "Unsafe story" })).rejects.toThrow();

    expect(addImage).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
