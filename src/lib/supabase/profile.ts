import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  credits: number;
  total_spins: number;
  total_wagered: number;
  total_won: number;
  biggest_win: number;
  highest_multiplier: number;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  credits: number | string;
  total_spins: number | string;
  total_wagered: number | string;
  total_won: number | string;
  biggest_win: number | string;
  highest_multiplier: number | string;
  created_at: string;
  updated_at: string;
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as ProfileRow;

  return {
    id: row.id,
    username: row.username,
    avatar_url: row.avatar_url,
    discord_id: row.discord_id,
    credits: Number(row.credits),
    total_spins: Number(row.total_spins),
    total_wagered: Number(row.total_wagered),
    total_won: Number(row.total_won),
    biggest_win: Number(row.biggest_win),
    highest_multiplier: Number(row.highest_multiplier),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
