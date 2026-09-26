import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type DemoStory = {
  fictional: boolean;
  students: string[];
  panels: Array<{
    index: number;
    image: string;
    description: string;
    narration: string;
    dialogue: Array<{ speaker: string; text: string }>;
  }>;
};

describe("fictional demo story fixture", () => {
  it("publishes twelve readable panels for the complete eight-student cast", () => {
    const root = resolve(process.cwd(), "public/demo/stories/misty-jar");
    const storyPath = resolve(root, "story.json");

    if (!existsSync(storyPath)) {
      throw new Error(`Missing demo story fixture: ${storyPath}`);
    }

    const raw = readFileSync(storyPath, "utf8");
    const story = JSON.parse(raw) as DemoStory;

    expect(story.fictional).toBe(true);
    expect(story.students).toEqual([
      "Maya Rivers",
      "Leo Martinez",
      "Amara Johnson",
      "Noah Chen",
      "Sophie Miller",
      "Eli Williams",
      "Priya Shah",
      "Finn Murphy",
    ]);
    expect(story.panels.map(({ index }) => index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(raw).not.toMatch(/[â�]/u);

    for (const panel of story.panels) {
      expect(panel.description.trim()).not.toBe("");
      expect(panel.narration.trim() || panel.dialogue.length > 0).toBeTruthy();

      const image = readFileSync(resolve(root, panel.image));
      expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    }
  });
});
