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
};

export default api;
