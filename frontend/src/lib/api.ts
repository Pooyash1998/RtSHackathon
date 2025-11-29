/**
 * API client configuration and utilities
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

/**
 * API client object with all endpoints
 */
export const api = {
  // Health check
  health: () => apiFetch<{ status: string; supabase_configured: boolean }>('/health'),

  // Classrooms
  classrooms: {
    getAll: () =>
      apiFetch<{
        success: boolean;
        classrooms: Array<{
          id: string;
          name: string;
          subject: string;
          grade_level: string;
          story_theme: string;
          design_style: string;
          student_count: number;
          story_count: number;
          created_at: string;
        }>;
      }>('/classrooms'),
    
    getById: (classroomId: string) =>
      apiFetch<{
        success: boolean;
        classroom: {
          id: string;
          name: string;
          subject: string;
          grade_level: string;
          story_theme: string;
          design_style: string;
          created_at: string;
          students: Array<{
            id: string;
            name: string;
            interests: string;
            avatar_url: string | null;
            photo_url: string | null;
            created_at: string;
          }>;
        };
      }>(`/classrooms/${classroomId}`),
    
    getStudents: (classroomId: string) =>
      apiFetch<{
        success: boolean;
        students: Array<{
          id: string;
          name: string;
          interests: string;
          avatar_url: string | null;
          photo_url: string | null;
          created_at: string;
        }>;
      }>(`/classrooms/${classroomId}/students`),
    
    getChapters: (classroomId: string) =>
      apiFetch<{
        success: boolean;
        chapters: Array<{
          id: string;
          index: number;
          chapter_outline: string;
          created_at: string;
        }>;
      }>(`/classrooms/${classroomId}/chapters`),
  },

  // Story generation
  story: {
    generateOptions: (classroomId: string, lessonPrompt: string) =>
      apiFetch<{
        success: boolean;
        options: Array<{
          id: string;
          title: string;
          summary: string;
          theme: string;
        }>;
      }>(`/story/generate-options?classroom_id=${classroomId}&lesson_prompt=${encodeURIComponent(lessonPrompt)}`, {
        method: 'POST',
      }),
  },

  // Avatar generation
  avatar: {
    create: (studentId: string) =>
      apiFetch<{
        success: boolean;
        student: any;
      }>(`/avatar/create/${studentId}`, {
        method: 'POST',
      }),
  },

  // Students
  students: {
    create: (name: string, interests: string, photoUrl?: string) =>
      apiFetch<{
        success: boolean;
        student: {
          id: string;
          name: string;
          interests: string;
          photo_url: string | null;
          avatar_url: string | null;
          created_at: string;
        };
      }>(`/students/create?name=${encodeURIComponent(name)}&interests=${encodeURIComponent(interests)}${photoUrl ? `&photo_url=${encodeURIComponent(photoUrl)}` : ''}`, {
        method: 'POST',
      }),
    
    joinClassroom: (studentId: string, classroomId: string) =>
      apiFetch<{
        success: boolean;
        message: string;
        student: {
          id: string;
          name: string;
          interests: string;
          photo_url: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        classroom: {
          id: string;
          name: string;
          subject: string;
          grade_level: string;
          story_theme: string;
        };
      }>(`/students/${studentId}/join-classroom/${classroomId}`, {
        method: 'POST',
      }),
    
    getById: (studentId: string) =>
      apiFetch<{
        success: boolean;
        student: {
          id: string;
          name: string;
          interests: string;
          photo_url: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        classrooms: Array<{
          id: string;
          name: string;
          subject: string;
          grade_level: string;
          story_theme: string;
          design_style: string;
          created_at: string;
        }>;
      }>(`/students/${studentId}`),
    
    getClassrooms: (studentId: string) =>
      apiFetch<{
        success: boolean;
        classrooms: Array<{
          id: string;
          name: string;
          subject: string;
          grade_level: string;
          story_theme: string;
          design_style: string;
          created_at: string;
        }>;
      }>(`/students/${studentId}/classrooms`),
    
    leaveClassroom: (studentId: string, classroomId: string) =>
      apiFetch<{
        success: boolean;
        message: string;
      }>(`/students/${studentId}/leave-classroom/${classroomId}`, {
        method: 'DELETE',
      }),
    
    uploadPhoto: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/students/upload-photo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      return await response.json() as { success: boolean; photo_url: string };
    },
  },
};

export default api;
