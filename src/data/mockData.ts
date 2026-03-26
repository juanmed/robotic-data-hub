import type { User, APIKey, Session, Stream, AssetFile, Annotation, Listing, Order } from "@/types";

export const mockUser: User = {
  id: "usr_001",
  email: "demo@gamiphyai.com",
  name: "Alex Chen",
  avatar_url: undefined,
  created_at: "2025-11-01T00:00:00Z",
};

export const mockApiKeys: APIKey[] = [
  { id: "key_001", user_id: "usr_001", name: "Production Key", key_prefix: "gpai_prod_", created_at: "2025-11-01T00:00:00Z", last_used_at: "2026-03-07T12:00:00Z" },
  { id: "key_002", user_id: "usr_001", name: "Development Key", key_prefix: "gpai_dev_", created_at: "2025-12-15T00:00:00Z" },
];

export const mockSessions: Session[] = [
  { id: "ses_001", user_id: "usr_001", name: "Warehouse Nav Run #42", description: "LiDAR + RGB sweep of warehouse floor B3", status: "completed", stream_count: 3, total_size_bytes: 2_400_000_000, created_at: "2026-02-20T14:30:00Z", updated_at: "2026-02-20T16:45:00Z" },
  { id: "ses_002", user_id: "usr_001", name: "Outdoor Terrain Mapping", description: "IMU and stereo camera data from rocky terrain traverse", status: "recording", stream_count: 2, total_size_bytes: 850_000_000, created_at: "2026-03-05T09:00:00Z", updated_at: "2026-03-05T09:00:00Z" },
  { id: "ses_003", user_id: "usr_001", name: "Arm Manipulation Demo", description: "6-DOF arm pick-and-place with depth camera", status: "draft", stream_count: 0, total_size_bytes: 0, created_at: "2026-03-07T11:00:00Z", updated_at: "2026-03-07T11:00:00Z" },
  { id: "ses_004", user_id: "usr_001", name: "Kitchen Robot Training v2", description: "Multi-camera kitchen environment capture", status: "completed", stream_count: 5, total_size_bytes: 5_100_000_000, created_at: "2026-01-10T08:00:00Z", updated_at: "2026-01-10T14:00:00Z" },
];

export const mockStreams: Stream[] = [
  { id: "str_001", session_id: "ses_001", name: "Front LiDAR", type: "lidar", device_name: "Velodyne VLP-16", sample_rate: "20 Hz", format: "pcd", file_count: 1200, files: [
    { id: "af_010", stream_id: "str_001", filename: "scan_000001.pcd", size_bytes: 2_000_000, content_type: "application/octet-stream", s3_key: "ses_001/str_001/scan_000001.pcd", uploaded_at: "2026-02-20T14:35:00Z" },
    { id: "af_011", stream_id: "str_001", filename: "scan_000002.pcd", size_bytes: 2_100_000, content_type: "application/octet-stream", s3_key: "ses_001/str_001/scan_000002.pcd", uploaded_at: "2026-02-20T14:35:01Z" },
  ] },
  { id: "str_002", session_id: "ses_001", name: "RGB Camera", type: "video", device_name: "Intel RealSense D435", sample_rate: "30 fps", format: "mp4", file_count: 1, files: [
    { id: "af_001", stream_id: "str_002", filename: "front_cam_001.mp4", size_bytes: 450_000_000, content_type: "video/mp4", s3_key: "ses_001/str_002/front_cam_001.mp4", uploaded_at: "2026-02-20T15:00:00Z" },
  ] },
  { id: "str_003", session_id: "ses_001", name: "IMU Sensor", type: "imu", device_name: "Bosch BNO055", sample_rate: "100 Hz", format: "csv", file_count: 1, files: [
    { id: "af_020", stream_id: "str_003", filename: "imu_data.csv", size_bytes: 12_000_000, content_type: "text/csv", s3_key: "ses_001/str_003/imu_data.csv", uploaded_at: "2026-02-20T15:10:00Z" },
  ] },
  { id: "str_004", session_id: "ses_002", name: "Stereo Left", type: "video", device_name: "ZED 2i", sample_rate: "15 fps", format: "mp4", file_count: 1 },
  { id: "str_005", session_id: "ses_002", name: "IMU + Magnetometer", type: "imu", device_name: "ICM-20948", sample_rate: "200 Hz", format: "csv", file_count: 2 },
  { id: "str_006", session_id: "ses_004", name: "Overhead Camera", type: "video", device_name: "Logitech Brio", sample_rate: "30 fps", format: "mp4", file_count: 3 },
  { id: "str_007", session_id: "ses_004", name: "Depth Camera", type: "depth", device_name: "Intel RealSense D455", sample_rate: "30 fps", format: "bag", file_count: 3 },
  { id: "str_008", session_id: "ses_004", name: "Arm Pose", type: "pose", device_name: "UR5e Joint Encoder", sample_rate: "125 Hz", format: "json", file_count: 1 },
  { id: "str_009", session_id: "ses_004", name: "Audio Mic", type: "audio", device_name: "Blue Yeti", sample_rate: "48 kHz", format: "wav", file_count: 1 },
  { id: "str_010", session_id: "ses_004", name: "Gripper Force", type: "other", device_name: "Robotiq FT-300", sample_rate: "100 Hz", format: "csv", file_count: 1 },
];

export const mockAssetFiles: AssetFile[] = [
  { id: "af_001", stream_id: "str_002", filename: "front_cam_001.mp4", size_bytes: 450_000_000, content_type: "video/mp4", s3_key: "ses_001/str_002/front_cam_001.mp4", uploaded_at: "2026-02-20T15:00:00Z" },
];

export const mockAnnotations: Annotation[] = [
  { id: "ann_001", asset_file_id: "af_001", author_id: "usr_001", type: "bounding_box", data: { label: "forklift", x: 120, y: 80, w: 200, h: 150 }, created_at: "2026-02-21T10:00:00Z" },
];

// Mock listings are no longer used for real data (now backed by Supabase),
// but kept for reference/testing purposes with the new schema.
export const mockListings: Listing[] = [
  { id: "lst_001", user_id: "usr_001", dataset_id: "ds_001", title: "Warehouse Navigation Dataset", description: "High-fidelity LiDAR + RGB data from a 10,000 sq ft warehouse. Includes IMU and annotated obstacle maps.", price_amount: 4900, currency: "USD", platform_fee_bps: 1000, license: "CC-BY-4.0", tags: ["lidar", "warehouse", "navigation", "indoor"], download_count: 127, published: true, created_at: "2026-02-22T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: "lst_002", user_id: "usr_001", dataset_id: "ds_002", title: "Kitchen Robot Manipulation v2", description: "Multi-angle depth + RGB of pick-and-place tasks in a real kitchen environment. 6 hours of continuous capture.", price_amount: 7900, currency: "USD", platform_fee_bps: 1000, license: "CC-BY-4.0", tags: ["manipulation", "kitchen", "depth", "rgb"], download_count: 54, published: true, created_at: "2026-01-15T00:00:00Z", updated_at: "2026-02-10T00:00:00Z" },
  { id: "lst_003", user_id: "usr_001", dataset_id: "ds_003", title: "Rocky Terrain Traversal Data", description: "Stereo camera and IMU data from outdoor rocky terrain. Ideal for off-road autonomy research.", price_amount: 0, currency: "USD", platform_fee_bps: 1000, license: "MIT", tags: ["outdoor", "terrain", "imu", "stereo"], download_count: 312, published: true, created_at: "2026-03-06T00:00:00Z", updated_at: "2026-03-06T00:00:00Z" },
];

export const mockOrders: Order[] = [
  { id: "ord_001", buyer_id: "usr_002", listing_id: "lst_001", amount: 4900, currency: "USD", status: "completed", created_at: "2026-03-01T00:00:00Z" },
];
