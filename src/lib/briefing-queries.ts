import { supabase } from "@/integrations/supabase/client";

export type Briefing = {
  id: string;
  client_name: string;
  project_type: string;
  title: string;
  intro: string | null;
  public_token: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export type Question = {
  id: string;
  briefing_id: string;
  order_index: number;
  title: string;
  description: string | null;
  kind: "single" | "multi" | "text";
  allow_comment: boolean;
};

export type QuestionOption = {
  id: string;
  question_id: string;
  order_index: number;
  image_url: string | null;
  label: string;
  tag: string | null;
  interpretation: string | null;
};

export type Response = {
  id: string;
  briefing_id: string;
  question_id: string;
  selected_option_ids: string[];
  text_answer: string | null;
  comment: string | null;
};

export type Report = {
  id: string;
  briefing_id: string;
  ai_text: string | null;
  edited_text: string | null;
  style_profile: Record<string, number> | null;
  generated_at: string;
};

export async function listBriefings(): Promise<Briefing[]> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Briefing[];
}

export async function getBriefingByToken(token: string) {
  const { data: briefing, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!briefing) return null;
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("briefing_id", briefing.id)
    .order("order_index");
  const qIds = (questions ?? []).map((q) => q.id);
  const { data: options } = qIds.length
    ? await supabase.from("question_options").select("*").in("question_id", qIds).order("order_index")
    : { data: [] };
  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("briefing_id", briefing.id);
  return {
    briefing: briefing as Briefing,
    questions: (questions ?? []) as Question[],
    options: (options ?? []) as QuestionOption[],
    responses: (responses ?? []) as Response[],
  };
}

export async function getBriefingById(id: string) {
  const { data: briefing } = await supabase.from("briefings").select("*").eq("id", id).maybeSingle();
  if (!briefing) return null;
  return getBriefingByToken((briefing as Briefing).public_token);
}

export async function saveResponse(input: {
  briefing_id: string;
  question_id: string;
  selected_option_ids: string[];
  text_answer?: string | null;
  comment?: string | null;
}) {
  const { error } = await supabase
    .from("responses")
    .upsert(input, { onConflict: "briefing_id,question_id" });
  if (error) throw error;
}

export async function completeBriefing(briefing_id: string) {
  const { error } = await supabase
    .from("briefings")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", briefing_id);
  if (error) throw error;
}

export async function getReport(briefing_id: string): Promise<Report | null> {
  const { data } = await supabase.from("reports").select("*").eq("briefing_id", briefing_id).maybeSingle();
  return (data as Report) ?? null;
}

export async function saveEditedReport(briefing_id: string, edited_text: string) {
  const { error } = await supabase.from("reports").update({ edited_text }).eq("briefing_id", briefing_id);
  if (error) throw error;
}

export async function resetPlatform() {
  await supabase.from("reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("responses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("briefings")
    .update({ status: "sent", completed_at: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");
}

export async function deleteBriefing(id: string) {
  const { error } = await supabase.from("briefings").delete().eq("id", id);
  if (error) throw error;
}
