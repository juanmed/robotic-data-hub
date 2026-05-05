import { createMediaService } from "./media/mediaServiceBase";

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

export const blogMediaService = createMediaService({
  bucketName: "blog-media",
  tableName: "blog_media",
  entityIdColumn: "post_id",
}) as ReturnType<typeof createMediaService> & {
  upload: (
    entityId: string,
    userId: string,
    file: File
  ) => Promise<BlogMedia>;
  list: (entityId: string) => Promise<BlogMedia[]>;
  getSignedUrl: (storagePath: string, expiresIn?: number) => Promise<string>;
  delete: (mediaId: string, storagePath: string) => Promise<void>;
  reorder: (items: { id: string; sort_order: number }[]) => Promise<void>;
};
