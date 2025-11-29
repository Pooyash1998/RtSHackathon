export interface Student {
  id: string;
  classroom_id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface StudentCreate {
  classroom_id: string;
  name: string;
  interests: string;
}
