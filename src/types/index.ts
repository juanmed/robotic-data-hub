export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: "draft" | "recording" | "completed" | "archived";
  stream_count: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Stream {
  id: string;
  session_id: string;
  name: string;
  type: "video" | "audio" | "imu" | "lidar" | "depth" | "pose" | "other";
  device_name?: string;
  sample_rate?: string;
  format: string;
  file_count: number;
  files?: AssetFile[];
}

export interface AssetFile {
  id: string;
  stream_id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  s3_key: string;
  uploaded_at: string;
}

export interface Annotation {
  id: string;
  asset_file_id: string;
  author_id: string;
  type: "bounding_box" | "segmentation" | "label" | "keypoint" | "custom";
  data: Record<string, unknown>;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  description: string;
  price_cents: number;
  tags: string[];
  download_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  listing_id: string;
  amount_cents: number;
  status: "pending" | "completed" | "refunded" | "cancelled";
  created_at: string;
}

export interface UploadKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  raw_key?: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  active: boolean;
}

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  source_format: string;
  status: "draft" | "uploading" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

export interface DatasetFile {
  id: string;
  dataset_id: string;
  relative_path: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  upload_status: "pending" | "uploaded" | "failed";
  created_at: string;
}
