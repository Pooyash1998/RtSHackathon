import {
  DEMO_CLASSROOM_ID,
  demoChapterPreviews,
  demoChapters,
  demoClassroom,
  demoMaterials,
  demoStudents,
} from "./data";

const demoClassroomDetail = {
  ...demoClassroom,
  students: demoStudents.map((student) => ({ ...student, status: "generated" })),
};

export async function demoApiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if ((options?.method ?? "GET").toUpperCase() !== "GET") {
    throw new Error("The public demo is read-only.");
  }

  let response: unknown;

  if (endpoint === "/classrooms") {
    response = { success: true, classrooms: [demoClassroom] };
  } else if (endpoint === `/classrooms/${DEMO_CLASSROOM_ID}`) {
    response = { success: true, classroom: demoClassroomDetail };
  } else if (endpoint === `/classrooms/${DEMO_CLASSROOM_ID}/students`) {
    response = { success: true, students: demoStudents };
  } else if (endpoint === `/classrooms/${DEMO_CLASSROOM_ID}/chapters`) {
    response = { success: true, chapters: demoChapters };
  } else if (endpoint === `/classrooms/${DEMO_CLASSROOM_ID}/materials`) {
    response = { success: true, materials: demoMaterials };
  } else if (endpoint === "/students") {
    response = { success: true, students: demoStudents };
  } else if (endpoint === "/settings") {
    response = {
      settings: {
        story_length: 12,
        default_design_style: "comic",
        openai_model: "gpt-5.6-sol",
        bfl_model: "flux-2-pro",
        automatic_panel_review: true,
        panel_review_attempt_cap: 2,
        reader_preferences: {},
      },
      provider_readiness: { openai: false, bfl: false },
      local_data: "Fictional public demo",
    };
  } else {
    const chapterMatch = endpoint.match(/^\/chapters\/([^/]+)$/);
    const chapter = chapterMatch && demoChapters.find(({ id }) => id === chapterMatch[1]);
    if (chapter) return { success: true, chapter } as T;

    const studentMatch = endpoint.match(/^\/students\/([^/]+)(?:\/(classrooms|chapters))?$/);
    const student = studentMatch && demoStudents.find(({ id }) => id === studentMatch[1]);

    if (studentMatch && !student) throw new Error("Student not found.");
    if (student && studentMatch?.[2] === "classrooms") {
      response = { success: true, classrooms: [demoClassroom] };
    } else if (student && studentMatch?.[2] === "chapters") {
      response = { success: true, chapters: demoChapterPreviews };
    } else if (student) {
      response = { success: true, student, classrooms: [demoClassroom] };
    } else {
      throw new Error(`Unknown public demo endpoint: ${endpoint}`);
    }
  }

  return response as T;
}
