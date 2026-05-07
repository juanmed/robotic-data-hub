import { supabase } from "@/integrations/supabase/client";

export interface BlogMedia {
  id: string;
  post_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

function generateUUID(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export const blogMediaService = {
  async upload(
    postId: string,
    userId: string,
    file: File
  ): Promise<BlogMedia> {
    const uuid = generateUUID();
    const safeName = sanitizeFilename(file.name);
    const storagePath = `${postId}/${uuid}-${safeName}`;

    // Upload file directly using authenticated session (which has RLS bypass via the storage bucket)
    const { error: uploadError } = await supabase.storage
      .from("blog-media")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Insert record into blog_media table
    const { data, error } = await supabase
      .from("blog_media")
      .insert({
        post_id: postId,
        uploaded_by: userId,
        storage_path: storagePath,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from("blog-media").remove([storagePath]);
      throw new Error(`Failed to save media record: ${error.message}`);
    }

    return data as BlogMedia;
  },

  async list(postId: string): Promise<BlogMedia[]> {
    const { data, error } = await supabase
      .from("blog_media")
      .select("*")
      .eq("post_id", postId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BlogMedia[];
  },

  async getSignedUrl(storagePath: string, expiresIn: number = 604800): Promise<string> {
    const { data, error } = await supabase.storage
      .from("blog-media")
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  async delete(mediaId: string, storagePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from("blog-media")
      .remove([storagePath]);

    if (storageError) throw storageError;

    const { error } = await supabase
      .from("blog_media")
      .delete()
      .eq("id", mediaId);

    if (error) throw error;
  },

  async reorder(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from("blog_media")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
      if (error) throw error;
    }
  },
};
