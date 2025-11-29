export interface Story {
  id: string;
  classroom_id: string;
  lesson_prompt: string;
  title: string;
  status: "generating" | "completed" | "failed" | "regenerating";
  progress: number;
  created_at: string;
}

export interface Panel {
  id: string;
  story_id: string;
  panel_number: number;
  image_url: string;
  dialogue: string;
  scene_description: string;
  created_at: string;
}

export interface StoryOption {
  id: string;
  title: string;
  summary: string;
  theme: string;
}

export interface StoryDetailResponse {
  story: Story;
  panels: Panel[];
  students: Student[];
}

import { Student } from "./student";
