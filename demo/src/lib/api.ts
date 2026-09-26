/**
 * API client configuration and utilities
 */
import type { Chapter, ChapterPreview, ChapterStatus, ChapterWithPanels, StoryIdea } from "@/types/story";
import type { Student } from "@/types/student";
import { demoApiFetch } from "@/demo/api";
import { isDemoMode } from "@/lib/runtime";

export interface Material {
  id: string;
  classroom_id: string;
  source_filename: string;
  extraction_state: "ready";
  content_hash: string;
  page_count: number;
  text_char_count: number;
}

export interface PanelRegenerationStatus {
  run_id: string;
  chapter_id: string;
  panel_number: number;
  status: "regenerating" | "candidate_ready" | "ready" | "failed";
  candidate_url: string | null;
  reported_bfl_cost: number | null;
  error_code: string | null;
  error_reference: string | null;
  cleanup_pending: boolean;
}

const API_BASE_URL = isDemoMode ? "" : import.meta.env.VITE_API_URL || (
  import.meta.env.DEV || import.meta.env.MODE === 'test'
    ? 'http://127.0.0.1:8000'
    : (() => { throw new Error('VITE_API_URL must be set for production builds.'); })()
);

/**
 * Base fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (isDemoMode) return demoApiFetch<T>(endpoint, options);

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const headers: HeadersInit = { ...options?.headers };

    // Only add Content-Type if not already set and if there's a body
    if (!headers['Content-Type'] && options?.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      const detail = typeof error.detail === "string" ? error.detail : error.detail?.message;
      throw new Error(detail || `HTTP ${response.status}: ${response.statusText}`);
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
  health: () => apiFetch<{ status: string }>('/health'),

  // Classrooms
  classrooms: {
    create: (data: {
      name: string;
      subject: string;
      grade_level: string;
      story_theme: string;
      design_style: string;
    }) =>
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
        };
      }>(
        '/classrooms',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

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
            avatar_thumbnail_url: string | null;
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
          avatar_thumbnail_url: string | null;
          created_at: string;
        }>;
      }>(`/classrooms/${classroomId}/students`),

    getChapters: (classroomId: string) =>
      apiFetch<{
        success: boolean;
        chapters: Chapter[];
      }>(`/classrooms/${classroomId}/chapters`),

    update: (classroomId: string, data: { name: string; subject: string; grade_level: string; story_theme: string; design_style: string }) =>
      apiFetch<{ success: boolean }>(`/classrooms/${classroomId}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (classroomId: string) =>
      apiFetch<{ success: boolean }>(`/classrooms/${classroomId}?confirm=true`, { method: 'DELETE' }),

  },

  materials: {
    getAll: (classroomId: string) =>
      apiFetch<{ success: boolean; materials: Material[] }>(`/classrooms/${classroomId}/materials`),
    upload: (classroomId: string, file: File) =>
      apiFetch<{ success: boolean; material: Material }>(
        `/classrooms/${classroomId}/materials?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file },
      ),
    delete: (materialId: string) =>
      apiFetch<{ success: boolean }>(`/materials/${materialId}?confirm=true`, { method: "DELETE" }),
  },

  // Story generation
  story: {
    startChapter: (classroomId: string, lessonPrompt: string, materialIds: string[] = []) =>
      apiFetch<{
        success: boolean;
        chapter: Chapter & {
          story_ideas: StoryIdea[];
          chosen_idea_id: string | null;
        };
      }>(`/classrooms/${classroomId}/chapters/start`, {
        method: 'POST',
        body: JSON.stringify({ lesson_prompt: lessonPrompt, ...(materialIds.length ? { material_ids: materialIds } : {}) }),
      }),

    chooseIdea: (chapterId: string, ideaId: string) =>
      apiFetch<{
        success: boolean;
        chapter: Chapter;
      }>(`/chapters/${chapterId}/choose-idea`, {
        method: 'POST',
        body: JSON.stringify({ idea_id: ideaId }),
      }),

    retryPreview: (chapterId: string, ideaId: string) =>
      apiFetch<{
        success: boolean;
        chapter: Chapter & { story_ideas: StoryIdea[] };
      }>(`/chapters/${chapterId}/story-ideas/${ideaId}/preview/retry`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),

    commitChapter: (chapterId: string, ideaId: string, idempotencyKey: string) =>
      apiFetch<{
        success: boolean;
        message: string;
        chapter_id: string;
        status: ChapterStatus;
      }>('/chapters/commit', {
        method: 'POST',
        body: JSON.stringify({
          chapter_id: chapterId,
          chosen_idea_id: ideaId,
          idempotency_key: idempotencyKey,
        }),
      }),
  },

  generationRuns: {
    resume: (runId: string) =>
      apiFetch<{ run_id: string; status: string }>(`/generation-runs/${runId}/resume`, {
        method: 'POST',
      }),
    discard: (runId: string) =>
      apiFetch<{ success: boolean; run_id: string }>(`/generation-runs/${runId}/discard?confirm=true`, {
        method: 'POST',
      }),
  },

  // Avatar generation
  avatar: {
    create: (studentId: string, portrait?: File) =>
      apiFetch<{
        success: boolean;
        student: Student;
      }>(`/avatar/create/${studentId}`, {
        method: 'POST',
        ...(portrait ? { body: portrait, headers: { 'Content-Type': portrait.type } } : {}),
      }),
  },

  // Students
  students: {
    getAll: () =>
      apiFetch<{
        success: boolean;
        students: Array<{
          id: string;
          name: string;
          interests: string;
          avatar_url: string | null;
          avatar_thumbnail_url: string | null;
          created_at: string;
        }>;
      }>('/students'),

    create: (name: string, interests: string, classroomId?: string, studentId?: string) =>
      apiFetch<{
        success: boolean;
        student: {
          id: string;
          name: string;
          interests: string;
          avatar_url: string | null;
          avatar_thumbnail_url: string | null;
          created_at: string;
        };
      }>('/students/create', {
        method: 'POST',
        body: JSON.stringify({ name, interests, classroom_id: classroomId, student_id: studentId }),
      }),

    joinClassroom: (studentId: string, classroomId: string) =>
      apiFetch<{
        success: boolean;
        message: string;
        student: {
          id: string;
          name: string;
          interests: string;
          avatar_url: string | null;
          avatar_thumbnail_url: string | null;
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
          avatar_url: string | null;
          avatar_thumbnail_url: string | null;
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

    getChapters: (studentId: string) =>
      apiFetch<{
        success: boolean;
        chapters: ChapterPreview[];
      }>(`/students/${studentId}/chapters`),

    leaveClassroom: (studentId: string, classroomId: string) =>
      apiFetch<{
        success: boolean;
        message: string;
      }>(`/students/${studentId}/leave-classroom/${classroomId}?confirm=true`, {
        method: 'DELETE',
      }),

    update: (studentId: string, data: { name: string; interests: string }) =>
      apiFetch<{ success: boolean; student: Student }>(`/students/${studentId}`, { method: 'PATCH', body: JSON.stringify(data) }),

    erase: (studentId: string) =>
      apiFetch<{ success: boolean }>(`/students/${studentId}?confirm=true`, { method: 'DELETE' }),

  },

  // Chapters
  chapters: {
    getById: (chapterId: string) =>
      apiFetch<{
        success: boolean;
        chapter: ChapterWithPanels;
      }>(`/chapters/${chapterId}`),

    regeneratePanel: (
      chapterId: string,
      panelNumber: number,
      expectedRevision: number,
      correction: string,
      idempotencyKey: string,
    ) => apiFetch<PanelRegenerationStatus>(
      `/chapters/${chapterId}/panels/${panelNumber}/regenerate`,
      {
        method: "POST",
        body: JSON.stringify({
          expected_revision: expectedRevision,
          correction,
          idempotency_key: idempotencyKey,
        }),
      },
    ),

    getPanelRegeneration: (runId: string) =>
      apiFetch<PanelRegenerationStatus>(`/panel-regenerations/${runId}`),

    acceptPanelRegeneration: (runId: string) =>
      apiFetch<PanelRegenerationStatus>(`/panel-regenerations/${runId}/accept`, { method: "POST" }),

    rejectPanelRegeneration: (runId: string) =>
      apiFetch<PanelRegenerationStatus>(`/panel-regenerations/${runId}/reject`, { method: "POST" }),

    delete: (chapterId: string) =>
      apiFetch<{
        success: boolean;
        message: string;
      }>(`/chapters/${chapterId}?confirm=true`, {
        method: 'DELETE',
      }),
  },

  settings: {
    get: () => apiFetch<{
      settings: {
        story_length: 12 | 20;
        default_design_style: 'manga' | 'comic' | 'cartoon';
        openai_model: 'gpt-5.6-sol' | 'gpt-5.6-terra' | 'gpt-5.6-luna';
        bfl_model: 'flux-2-pro' | 'flux-2-flex';
        automatic_panel_review: boolean;
        panel_review_attempt_cap: 1 | 2 | 3;
        reader_preferences: Record<string, boolean>;
      };
      provider_readiness: { openai: boolean; bfl: boolean };
      local_data: string;
    }>('/settings'),
    update: (settings: Awaited<ReturnType<typeof api.settings.get>>['settings']) =>
      apiFetch<{ success: boolean }>('/settings', { method: 'PATCH', body: JSON.stringify(settings) }),
    reset: () => apiFetch<{ success: boolean }>('/settings/reset-local-data?confirm=true', { method: 'POST' }),
  },
};

export default api;
