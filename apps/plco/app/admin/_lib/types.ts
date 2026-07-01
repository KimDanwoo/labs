export type CharacterRow = {
  id: string;
  name: string;
  color: string;
  bg_color: string;
  border_color: string;
  emoji: string;
  is_active: boolean;
  sort_order: number;
};

export type MeetingOption = {
  text: string;
  outcome: 'good' | 'ok' | 'awkward';
  reaction: string;
};

export type MeetingSceneRow = {
  id: string;
  character_id: string;
  category: string;
  prompt: string;
  options: MeetingOption[];
  is_active: boolean;
  sort_order: number;
};

export type QuizRow = {
  id: string;
  character_id: string;
  question: string;
  options: string[];
  correct_index: number;
  fact: string;
  is_active: boolean;
  sort_order: number;
};
