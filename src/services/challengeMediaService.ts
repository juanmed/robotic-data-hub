import { supabase } from "@/integrations/supabase/client";
import type { ChallengeMedia } from "@/types";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export const challengeMediaService = {
  async upload(challengeId: string, userId: string, file: File): Promise<ChallengeMedia> {
    const uuid = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    const safeName = sanitizeFilename(file.name);
    const storagePath = `${userId}/${challengeId}/${uuid}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("challenge-media")
      .upload(storagePath, file, { contentType: file.type });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("challenge_media")
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        storage_path: storagePath,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ChallengeMedia;
  },

  async list(challengeId: string): Promise<ChallengeMedia[]> {
    const { data, error } = await supabase
      .from("challenge_media")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ChallengeMedia[];
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from("challenge-media")
      .createSignedUrl(storagePath, 60);
    if (error) throw error;
    return data.signedUrl;
  },

  async getEmbedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from("challenge-media")
      .createSignedUrl(storagePath, 157680000); // 5 years
    if (error) throw error;
    return data.signedUrl;
  },

  async delete(mediaId: string, storagePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from("challenge-media")
      .remove([storagePath]);
    if (storageError) throw storageError;

    const { error } = await supabase
      .from("challenge_media")
      .delete()
      .eq("id", mediaId);
    if (error) throw error;
  },

  async reorder(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from("challenge_media")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
      if (error) throw error;
    }
  },
};
