export interface Student {
  id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface StudentWithClassrooms extends Student {
  classrooms: Array<{
    id: string;
    name: string;
    subject: string;
    grade_level: string;
    story_theme: string;
    design_style: string;
    created_at: string;
  }>;
}
