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

export interface ClassroomCreate {
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: "manga" | "comic" | "cartoon";
  duration: string;
}
