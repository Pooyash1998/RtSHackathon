import { Student } from '@/types/student';
import { Classroom } from '@/types/classroom';
import { Story, Panel } from '@/types/story';

export const mockStudents: Student[] = [
  {
    id: "student-1",
    name: "Emma Johnson",
    interests: "Space, Robots",
    avatar_url: null,
    photo_url: null,
    created_at: "2024-11-01T00:00:00Z"
  },
  {
    id: "student-2",
    name: "Liam Chen",
    interests: "Sports, Adventure",
    avatar_url: null,
    photo_url: null,
    created_at: "2024-11-02T00:00:00Z"
  },
  {
    id: "student-3",
    name: "Sophia Martinez",
    interests: "Mystery, Books",
    avatar_url: null,
    photo_url: null,
    created_at: "2024-11-03T00:00:00Z"
  }
];

export const mockClassrooms: Classroom[] = [
  {
    id: "class-1",
    name: "Physics 101",
    subject: "Physics",
    grade_level: "10",
    story_theme: "Space Adventure",
    design_style: "manga",
    duration: "1 semester",
    created_at: "2024-10-01T00:00:00Z"
  },
  {
    id: "class-2",
    name: "Math Advanced",
    subject: "Math",
    grade_level: "10",
    story_theme: "Time Travel Mystery",
    design_style: "comic",
    duration: "1 semester",
    created_at: "2024-10-01T00:00:00Z"
  }
];

export const mockStories: Story[] = [
  {
    id: "story-1",
    classroom_id: "class-1",
    lesson_prompt: "Newton's Laws of Motion",
    title: "Newton's Space Race",
    status: "completed",
    progress: 100,
    created_at: "2024-11-25T00:00:00Z",
    design_style: "manga"
  },
  {
    id: "story-2",
    classroom_id: "class-2",
    lesson_prompt: "Algebra Fundamentals",
    title: "The Equation Adventure",
    status: "completed",
    progress: 100,
    created_at: "2024-11-28T00:00:00Z",
    design_style: "comic"
  }
];

// Create 20 panels for story-1
export const mockPanels: Panel[] = Array.from({ length: 20 }, (_, i) => ({
  id: `panel-1-${i + 1}`,
  story_id: "story-1",
  panel_number: i + 1,
  image_url: "",
  dialogue: `Panel ${i + 1}: Emma, Liam, and Sophia discuss Newton's Laws!`,
  scene_description: `Scene ${i + 1}`,
  created_at: "2024-11-25T00:00:00Z"
}));

// Helper functions
export const getStudentById = (id: string): Student | undefined =>
  mockStudents.find(s => s.id === id);

export const getClassroomById = (id: string): Classroom | undefined =>
  mockClassrooms.find(c => c.id === id);

export const getStoryById = (id: string): Story | undefined =>
  mockStories.find(s => s.id === id);

// Mock many-to-many relationships (student_id -> classroom_ids)
const mockStudentClassrooms: Record<string, string[]> = {
  "student-1": ["class-1"],
  "student-2": ["class-1"],
  "student-3": ["class-1"]
};

export const getClassroomsByStudentId = (studentId: string): Classroom[] => {
  const classroomIds = mockStudentClassrooms[studentId] || [];
  return mockClassrooms.filter(c => classroomIds.includes(c.id));
};

export const getStudentsByClassroomId = (classroomId: string): Student[] => {
  const studentIds = Object.entries(mockStudentClassrooms)
    .filter(([_, classrooms]) => classrooms.includes(classroomId))
    .map(([studentId]) => studentId);
  return mockStudents.filter(s => studentIds.includes(s.id));
};

export const getStoriesByClassroomId = (classroomId: string): Story[] =>
  mockStories.filter(s => s.classroom_id === classroomId);

export const getNewestStoryForStudent = (studentId: string): Story | undefined => {
  const classrooms = getClassroomsByStudentId(studentId);
  const classroomIds = classrooms.map(c => c.id);
  const stories = mockStories.filter(s => classroomIds.includes(s.classroom_id));
  return stories.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
};

export const getPanelsByStoryId = (storyId: string): Panel[] =>
  mockPanels
    .filter(p => p.story_id === storyId)
    .sort((a, b) => a.panel_number - b.panel_number);

export const getStoryWithPanels = (storyId: string) => {
  const story = getStoryById(storyId);
  if (!story) return null;

  const panels = getPanelsByStoryId(storyId);
  return {
    ...story,
    panels
  };
};

export const getAllStoriesForStudent = (studentId: string): Story[] => {
  const classrooms = getClassroomsByStudentId(studentId);
  const classroomIds = classrooms.map(c => c.id);
  return mockStories
    .filter(s => classroomIds.includes(s.classroom_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};
