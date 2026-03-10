import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch profile data for trainers by looking up user_id -> profiles
 */
export async function fetchTrainersWithProfiles(query?: any) {
  const { data: trainers, error, count } = query 
    ? await query 
    : await supabase.from("trainers").select("*").eq("approval_status", "approved");
  
  if (!trainers || trainers.length === 0) return { trainers: trainers || [], count };

  const userIds = trainers.map((t: any) => t.user_id);
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
  
  const profileMap: Record<string, any> = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  
  const enriched = trainers.map((t: any) => ({ ...t, profile: profileMap[t.user_id] || null }));
  return { trainers: enriched, count };
}

/**
 * Fetch profile name for a user_id
 */
export async function fetchProfileName(userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name || "Unknown";
}

/**
 * Fetch profiles for multiple user_ids
 */
export async function fetchProfilesMap(userIds: string[]): Promise<Record<string, any>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase.from("profiles").select("*").in("id", userIds);
  const map: Record<string, any> = {};
  (data || []).forEach(p => { map[p.id] = p; });
  return map;
}
