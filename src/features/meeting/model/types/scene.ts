export type ConversationOutcome = 'good' | 'ok' | 'awkward';

export type ConversationOption = {
  text: string;
  outcome: ConversationOutcome;
  reaction: string;
};

export type ConversationScene = {
  id: string;
  category: 'food' | 'hobby' | 'compliment' | 'comfort' | 'plan' | 'small-talk';
  prompt: string;
  options: ConversationOption[];
};
