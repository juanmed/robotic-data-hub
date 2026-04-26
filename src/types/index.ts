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
  dataset_id: string;
  title: string;
  description: string;
  price_amount: number;
  currency: string;
  platform_fee_bps: number;
  license: string;
  tags: string[];
  download_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrichedListing extends Listing {
  creator_name: string;
  file_paths: string[];
}

export interface Order {
  id: string;
  buyer_id: string;
  listing_id: string;
  amount: number;
  currency: string;
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
  display_name: string;
  source_repo_id: string | null;
  status: "uploading" | "ready" | "failed";
  metadata: Record<string, unknown> | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface DatasetFile {
  id: string;
  dataset_id: string;
  relative_path: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  upload_status: "pending" | "uploaded";
  created_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "inactive" | "closed";
  compensation_amount: number;
  compensation_per: "dataset" | "challenge";
  currency: string;
  deadline: string | null;
  constraints: string;
  conditions: string;
  tags: string[];
  submission_count: number;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeMedia {
  id: string;
  challenge_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  dataset_id: string;
  submitter_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface ChallengeSubmissionEnriched extends ChallengeSubmission {
  dataset_display_name: string | null;
  submitter_name: string | null;
}

export interface ParticipantSubmissionItem extends ChallengeSubmission {
  challenge: Pick<
    Challenge,
    "id" | "title" | "compensation_amount" | "compensation_per" | "currency" | "status"
  > | null;
  dataset_display_name: string | null;
}

export interface EnrichedChallenge extends Challenge {
  creator_name: string;
  preview_url: string | null;
}
