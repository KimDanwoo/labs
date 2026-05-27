import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseGameSave = {
  id: string;
  user_id: string;
  character_id: string;
  nickname: string;
  status: string;
  level: number;
  exp: number;
  hunger: number;
  cleanliness: number;
  hearts: number;
  coins: number;
  poops: unknown[];
  inventory: Record<string, number>;
  pending_poops: number[];
  is_sleeping: boolean;
  woke_up_at: number | null;
  is_sick: boolean;
  sick_since: number | null;
  hunger_zero_since: number | null;
  cleanliness_zero_since: number | null;
  unlocked_characters: string[];
  egg_ready_character_id: string | null;
  level_up_message: string | null;
  last_updated: number;
};
