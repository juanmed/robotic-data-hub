import type { AssetFile } from "@/types";
import { mockAssetFiles } from "@/data/mockData";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const uploadService = {
  async upload(_sessionId: string, _streamId: string, _file: File): Promise<AssetFile> {
    await delay(1000);
    return mockAssetFiles[0];
  },
  async listFiles(streamId: string): Promise<AssetFile[]> {
    await delay();
    return mockAssetFiles.filter((f) => f.stream_id === streamId);
  },
};
