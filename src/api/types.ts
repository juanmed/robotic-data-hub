export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "completed";
  created_at: string;
}

export interface Stream {
  id: string;
  session_id: string;
  name: string;
  type: "video" | "lidar" | "imu" | "audio" | "custom";
  format: string;
}

export interface AssetFile {
  id: string;
  stream_id: string;
  filename: string;
  size: number;
  content_type: string;
  s3_key: string;
  uploaded_at: string;
}

export interface Annotation {
  id: string;
  asset_file_id: string;
  type: string;
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
  published: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  listing_id: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
}
