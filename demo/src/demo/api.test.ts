import { describe, expect, it } from "vitest";
import { demoApiFetch } from "./api";

describe("public demo API", () => {
  it("returns the fictional classroom roster", async () => {
    const response = await demoApiFetch<{ classroom: { students: unknown[] } }>(
      "/classrooms/class-5b-science",
    );

    expect(response.classroom.students).toHaveLength(8);
  });

  it("returns the complete twelve-panel story", async () => {
    const response = await demoApiFetch<{ chapter: { panels: unknown[] } }>(
      "/chapters/misty-jar",
    );

    expect(response.chapter.panels).toHaveLength(12);
  });

  it("lists both fictional classroom stories", async () => {
    const response = await demoApiFetch<{ chapters: Array<{ id: string }> }>(
      "/classrooms/class-5b-science/chapters",
    );

    expect(response.chapters.map(({ id }) => id)).toEqual([
      "misty-jar",
      "floating-art-box",
    ]);
  });

  it("returns the complete lever story", async () => {
    const response = await demoApiFetch<{ chapter: { panels: unknown[] } }>(
      "/chapters/floating-art-box",
    );

    expect(response.chapter.panels).toHaveLength(12);
  });

  it("returns student stories newest first", async () => {
    const response = await demoApiFetch<{ chapters: Array<{ id: string }> }>(
      "/students/maya-rivers/chapters",
    );

    expect(response.chapters.map(({ id }) => id)).toEqual([
      "floating-art-box",
      "misty-jar",
    ]);
  });

  it("lists both fictional teaching materials", async () => {
    const response = await demoApiFetch<{ materials: Array<{ id: string }> }>(
      "/classrooms/class-5b-science/materials",
    );

    expect(response.materials.map(({ id }) => id)).toEqual([
      "clouds-and-rain-material",
      "levers-material",
    ]);
  });

  it("never permits writes", async () => {
    await expect(demoApiFetch("/classrooms", { method: "POST" })).rejects.toThrow(
      "The public demo is read-only.",
    );
  });

  it("does not substitute a different student for an unknown profile", async () => {
    await expect(demoApiFetch("/students/not-a-student")).rejects.toThrow(
      "Student not found.",
    );
  });
});
