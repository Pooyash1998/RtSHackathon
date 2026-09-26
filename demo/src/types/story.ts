export interface Panel {
  id: string;
  chapter_id: string;
  index: number;
  image: string;
  created_at: string;
}

export type StoryPreviewStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface StoryIdea {
  id: string;
  title: string;
  summary: string;
  theme: string;
  preview_status: StoryPreviewStatus;
  preview_url: string | null;
  preview_error_reference?: string | null;
}

export interface TemporaryPanelPreview {
  index: number;
  image: string;
}

export type ChapterStatus =
  | 'draft'
  | 'awaiting_choice'
  | 'options_generated'
  | 'idea_chosen'
  | 'generating'
  | 'ready'
  | 'failed';

export interface Chapter {
  id: string;
  classroom_id: string;
  index: number;
  revision: number;
  chapter_outline: string | null;
  original_prompt: string;
  thumbnail_url: string | null;
  story_title: string;
  story_description: string;
  story_ideas?: StoryIdea[];
  temporary_panel_previews?: TemporaryPanelPreview[];
  generation_failure?: {
    run_id?: string;
    error_code: string | null;
    error_reference: string | null;
    panel_number: number | null;
    completed_panels?: number;
    expected_panels?: number;
    reported_bfl_cost?: number;
    resumable?: boolean;
  } | null;
  panel_regeneration_candidate?: {
    run_id: string;
    panel_number: number;
    candidate_url: string;
    reported_bfl_cost: number | null;
  } | null;
  status: ChapterStatus;
  created_at: string;
  grounded_sources?: Array<{
    material_id: string;
    content_hash: string;
    source_label: string;
    excerpts: Array<{ page: number; text: string }>;
  }>;
}

export interface ChapterWithPanels extends Chapter {
  panels: Panel[];
}

export interface ChapterPreview extends Chapter {
  classroom_name: string;
  classroom_subject: string;
}
