export interface Panel {
  id: string;
  story_id: string;
  panel_number: number;
  image_url: string;
  dialogue: string;
  scene_description: string;
  created_at: string;
}

export interface Story {
  id: string;
  classroom_id: string;
  lesson_prompt: string;
  title: string;
  status: 'generating' | 'completed' | 'failed' | 'regenerating';
  progress: number;
  created_at: string;
  design_style?: 'manga' | 'comic' | 'cartoon';
}

export interface StoryWithPanels extends Story {
  panels: Panel[];
}

export interface StoryPreview {
  id: string;
  title: string;
  created_at: string;
  thumbnail_url: string;
  classroom_name: string;
}
