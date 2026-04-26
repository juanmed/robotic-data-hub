import type {
  User,
  Session,
  Stream,
  AssetFile,
  Annotation,
  Dataset,
  DatasetFile,
  UploadKey,
  APIKey,
  Listing,
  Order,
  Challenge,
  EnrichedChallenge,
} from '@/types';

let sessionCounter = 1;
let streamCounter = 1;
let annotationCounter = 1;
let datasetCounter = 1;
let fileCounter = 1;
let keyCounter = 1;

export const resetCounters = () => {
  sessionCounter = 1;
  streamCounter = 1;
  annotationCounter = 1;
  datasetCounter = 1;
  fileCounter = 1;
  keyCounter = 1;
};

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'usr_test_001',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: `ses_test_${sessionCounter++}`,
  user_id: 'usr_test_001',
  name: `Test Session ${sessionCounter}`,
  description: 'A test session',
  status: 'draft',
  stream_count: 0,
  total_size_bytes: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockStream = (sessionId: string, overrides?: Partial<Stream>): Stream => ({
  id: `str_test_${streamCounter++}`,
  session_id: sessionId,
  name: `Test Stream ${streamCounter}`,
  type: 'video',
  format: 'mp4',
  file_count: 0,
  ...overrides,
});

export const createMockAssetFile = (streamId: string, overrides?: Partial<AssetFile>): AssetFile => ({
  id: `af_test_${fileCounter++}`,
  stream_id: streamId,
  filename: `file_${fileCounter}.mp4`,
  size_bytes: 1000000,
  content_type: 'video/mp4',
  s3_key: `sessions/${streamId}/file_${fileCounter}.mp4`,
  uploaded_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAnnotation = (
  assetFileId: string,
  overrides?: Partial<Annotation>
): Annotation => ({
  id: `ann_test_${annotationCounter++}`,
  asset_file_id: assetFileId,
  author_id: 'usr_test_001',
  type: 'bounding_box',
  data: { label: 'test', x: 10, y: 20, w: 30, h: 40 },
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockDataset = (overrides?: Partial<Dataset>): Dataset => ({
  id: `ds_test_${datasetCounter++}`,
  user_id: 'usr_test_001',
  display_name: `Test Dataset ${datasetCounter}`,
  source_repo_id: null,
  status: 'ready',
  metadata: null,
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  ...overrides,
});

export const createMockDatasetFile = (datasetIdOrOverrides?: string | Partial<DatasetFile>, overrides?: Partial<DatasetFile>): DatasetFile => {
  const datasetId = typeof datasetIdOrOverrides === 'string' ? datasetIdOrOverrides : 'ds_test_default';
  const finalOverrides = typeof datasetIdOrOverrides === 'string' ? overrides : datasetIdOrOverrides;
  return {
    id: `df_test_${fileCounter++}`,
    dataset_id: datasetId,
    relative_path: `files/file_${fileCounter}.txt`,
    storage_path: `datasets/${datasetId}/file_${fileCounter}.txt`,
    content_type: 'text/plain',
    size_bytes: 1000,
    upload_status: 'uploaded',
    created_at: new Date().toISOString(),
    ...finalOverrides,
  };
};

export const createMockUploadKey = (overrides?: Partial<UploadKey>): UploadKey => ({
  id: `key_test_${keyCounter++}`,
  user_id: 'usr_test_001',
  name: `Test Key ${keyCounter}`,
  key_prefix: `test_prefix_${keyCounter}`,
  raw_key: `raw_key_value_${keyCounter}`,
  created_at: new Date().toISOString(),
  last_used_at: null,
  revoked_at: null,
  active: true,
  ...overrides,
});

export const createMockAPIKey = (overrides?: Partial<APIKey>): APIKey => ({
  id: `apikey_test_${keyCounter++}`,
  user_id: 'usr_test_001',
  name: `Test API Key ${keyCounter}`,
  key_prefix: `api_prefix_${keyCounter}`,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockListing = (datasetIdOrOverrides?: string | Partial<Listing>, overrides?: Partial<Listing>): Listing => {
  const datasetId = typeof datasetIdOrOverrides === 'string' ? datasetIdOrOverrides : 'ds_test_default';
  const finalOverrides = typeof datasetIdOrOverrides === 'string' ? overrides : datasetIdOrOverrides;
  return {
    id: `lst_test_${sessionCounter}`,
    user_id: 'usr_test_001',
    dataset_id: datasetId,
    title: `Test Listing for ${datasetId}`,
    description: 'A test listing',
    price_amount: 4900,
    currency: 'USD',
    platform_fee_bps: 1000,
    license: 'CC-BY-4.0',
    tags: ['test', 'sample'],
    download_count: 0,
    published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...finalOverrides,
  };
};

export const createMockOrder = (listingId: string, overrides?: Partial<Order>): Order => ({
  id: `ord_test_${sessionCounter}`,
  buyer_id: 'usr_test_002',
  listing_id: listingId,
  amount: 4900,
  currency: 'USD',
  status: 'completed',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPaymentMethod = (overrides?: any) => ({
  id: 'pm_test_001',
  type: 'card',
  card: {
    last4: '4242',
    brand: 'visa',
    exp_month: 12,
    exp_year: 2028,
  },
  billing_details: {
    name: 'John Doe',
    address: {
      country: 'US',
      postal_code: '10001',
    },
  },
  ...overrides,
});

export const createMockCharge = (overrides?: any) => ({
  id: 'ch_test_001',
  amount: 4900,
  currency: 'usd',
  status: 'succeeded',
  description: 'Navigation Dataset',
  created: Math.floor(Date.now() / 1000),
  ...overrides,
});

let challengeCounter = 1;

export const createMockChallenge = (overrides?: Partial<Challenge>): Challenge => ({
  id: `chl_test_${challengeCounter++}`,
  user_id: 'usr_test_001',
  title: `Test Challenge ${challengeCounter}`,
  description: 'A test challenge description',
  status: 'active',
  compensation_amount: 5000,
  compensation_per: 'dataset',
  currency: 'USD',
  deadline: null,
  constraints: '',
  conditions: '',
  tags: ['test'],
  submission_count: 0,
  published_at: new Date().toISOString(),
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockEnrichedChallenge = (overrides?: Partial<EnrichedChallenge>): EnrichedChallenge => ({
  ...createMockChallenge(overrides),
  creator_name: overrides?.creator_name ?? 'Test Creator',
  preview_url: overrides?.preview_url ?? null,
  ...overrides,
});
