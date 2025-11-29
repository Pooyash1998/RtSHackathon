// Classroom types
export interface ClassroomCreate {
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: "manga" | "comic" | "cartoon";
  duration: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: "manga" | "comic" | "cartoon";
  duration: string;
  created_at: string;
}

// Student types
export interface StudentCreate {
  classroom_id: string;
  name: string;
  interests: string;
}

export interface Student {
  id: string;
  classroom_id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface PhotoUploadResponse {
  photo_url: string;
}

export interface AvatarGenerateRequest {
  use_photo: boolean;
}

export interface AvatarGenerateResponse {
  avatar_url: string | null;
  status: "generating" | "completed";
}

// Story types
export interface StoryOption {
  id: string;
  title: string;
  summary: string;
  theme: string;
}

export interface StoryOptionsRequest {
  classroom_id: string;
  lesson_prompt: string;
}

export interface StoryOptionsResponse {
  options: StoryOption[];
}

export interface StoryGenerateRequest {
  classroom_id: string;
  selected_option_id: string;
  lesson_prompt: string;
}

export interface StoryGenerateResponse {
  story_id: string;
  status: "generating";
  progress: number;
}

export interface StoryProgressResponse {
  story_id: string;
  status: "generating" | "completed" | "failed" | "regenerating";
  progress: number;
  panels_completed: number;
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

export interface Story {
  id: string;
  classroom_id: string;
  lesson_prompt: string;
  title: string;
  status: "generating" | "completed" | "failed" | "regenerating";
  progress: number;
  created_at: string;
}

export interface StoryDetailResponse {
  story: Story;
  panels: Panel[];
  students: Student[];
}

export interface RegenerateRequest {
  panel_numbers: number[];
  correction_prompt: string;
}

export interface RegenerateResponse {
  status: "regenerating";
}

// Export types
export interface ExportPDFResponse {
  pdf_url: string;
  expires_at: string;
}
