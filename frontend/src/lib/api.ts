import type {
  Classroom,
  ClassroomCreate,
  Student,
  StudentCreate,
  PhotoUploadResponse,
  AvatarGenerateRequest,
  AvatarGenerateResponse,
  StoryOptionsRequest,
  StoryOptionsResponse,
  StoryGenerateRequest,
  StoryGenerateResponse,
  StoryProgressResponse,
  StoryDetailResponse,
  RegenerateRequest,
  RegenerateResponse,
  ExportPDFResponse,
  Story,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// Classroom APIs
export async function createClassroom(
  data: ClassroomCreate
): Promise<Classroom> {
  return apiCall<Classroom>("/api/classrooms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClassroom(id: string): Promise<Classroom> {
  return apiCall<Classroom>(`/api/classrooms/${id}`);
}

export async function listClassrooms(): Promise<Classroom[]> {
  return apiCall<Classroom[]>("/api/classrooms");
}

export async function getClassroomStudents(
  classroomId: string
): Promise<Student[]> {
  return apiCall<Student[]>(`/api/classrooms/${classroomId}/students`);
}

export async function getClassroomStories(
  classroomId: string
): Promise<Story[]> {
  return apiCall<Story[]>(`/api/classrooms/${classroomId}/stories`);
}

// Student APIs
export async function createStudent(data: StudentCreate): Promise<Student> {
  return apiCall<Student>("/api/students", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getStudent(id: string): Promise<Student> {
  return apiCall<Student>(`/api/students/${id}`);
}

export async function uploadStudentPhoto(
  studentId: string,
  photo: File
): Promise<PhotoUploadResponse> {
  const formData = new FormData();
  formData.append("photo", photo);

  const response = await fetch(
    `${API_BASE}/api/students/${studentId}/photo`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function generateAvatar(
  studentId: string,
  request: AvatarGenerateRequest
): Promise<AvatarGenerateResponse> {
  return apiCall<AvatarGenerateResponse>(
    `/api/students/${studentId}/generate-avatar`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

// Story APIs
export async function generateStoryOptions(
  request: StoryOptionsRequest
): Promise<StoryOptionsResponse> {
  return apiCall<StoryOptionsResponse>("/api/stories/generate-options", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function generateStory(
  request: StoryGenerateRequest
): Promise<StoryGenerateResponse> {
  return apiCall<StoryGenerateResponse>("/api/stories/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getStoryProgress(
  storyId: string
): Promise<StoryProgressResponse> {
  return apiCall<StoryProgressResponse>(`/api/stories/${storyId}/progress`);
}

export async function getStory(storyId: string): Promise<StoryDetailResponse> {
  return apiCall<StoryDetailResponse>(`/api/stories/${storyId}`);
}

export async function regeneratePanels(
  storyId: string,
  request: RegenerateRequest
): Promise<RegenerateResponse> {
  return apiCall<RegenerateResponse>(
    `/api/stories/${storyId}/regenerate`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

// Export APIs
export async function exportStoryPDF(storyId: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/api/stories/${storyId}/export/pdf`
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

export async function getExportPDFUrl(
  storyId: string
): Promise<ExportPDFResponse> {
  return apiCall<ExportPDFResponse>(
    `/api/stories/${storyId}/export/pdf`,
    {
      method: "POST",
    }
  );
}
