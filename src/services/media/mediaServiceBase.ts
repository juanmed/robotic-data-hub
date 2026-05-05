import { supabase } from "@/integrations/supabase/client";

export interface MediaItem {
  id: string;
  [key: string]: unknown;
}

export interface MediaServiceConfig {
  bucketName: string;
  tableName: string;
  entityIdColumn: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

function generateUUID(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

export function createMediaService(config: MediaServiceConfig) {
  return {
    async upload(
      entityId: string,
      userId: string,
      file: File
    ): Promise<Record<string, unknown>> {
      const uuid = generateUUID();
      const safeName = sanitizeFilename(file.name);
      const storagePath = `${entityId}/${uuid}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(config.bucketName)
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from(config.tableName)
        .insert({
          [config.entityIdColumn]: entityId,
          uploaded_by: userId,
          storage_path: storagePath,
          file_name: file.name,
          content_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Record<string, unknown>;
    },

    async list(entityId: string): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from(config.tableName)
        .select("*")
        .eq(config.entityIdColumn, entityId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    },

    async getSignedUrl(storagePath: string, expiresIn: number = 604800): Promise<string> {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .createSignedUrl(storagePath, expiresIn);
      if (error) throw error;
      return data.signedUrl;
    },

    async delete(mediaId: string, storagePath: string): Promise<void> {
      const { error: storageError } = await supabase.storage
        .from(config.bucketName)
        .remove([storagePath]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from(config.tableName)
        .delete()
        .eq("id", mediaId);
      if (error) throw error;
    },

    async reorder(items: { id: string; sort_order: number }[]): Promise<void> {
      for (const item of items) {
        const { error } = await supabase
          .from(config.tableName)
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
  };
}
