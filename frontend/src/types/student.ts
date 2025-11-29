export interface Student {
  id: string;
  classroom_id: string;
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
    avatar_url: string | null;
  }>;
}
