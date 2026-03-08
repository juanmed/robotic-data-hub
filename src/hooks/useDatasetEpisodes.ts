import { useState, useEffect } from "react";

interface Episode {
  index: number;
  label: string;
  numFrames: number;
  duration: string;
}

interface DatasetEpisodes {
  episodes: Episode[];
  loading: boolean;
  totalEpisodes: number;
}

const mockEpisodesMap: Record<string, Episode[]> = {
  "lerobot/pusht": [
    { index: 0, label: "Episode 0", numFrames: 300, duration: "10.0s" },
    { index: 1, label: "Episode 1", numFrames: 280, duration: "9.3s" },
    { index: 2, label: "Episode 2", numFrames: 350, duration: "11.7s" },
    { index: 3, label: "Episode 3", numFrames: 420, duration: "14.0s" },
    { index: 4, label: "Episode 4", numFrames: 260, duration: "8.7s" },
    { index: 5, label: "Episode 5", numFrames: 310, duration: "10.3s" },
  ],
  "lerobot/aloha_mobile_cabinet": [
    { index: 0, label: "Episode 0", numFrames: 500, duration: "16.7s" },
    { index: 1, label: "Episode 1", numFrames: 480, duration: "16.0s" },
    { index: 2, label: "Episode 2", numFrames: 520, duration: "17.3s" },
  ],
  "lerobot/aloha_static_cups_open": [
    { index: 0, label: "Episode 0", numFrames: 200, duration: "6.7s" },
    { index: 1, label: "Episode 1", numFrames: 220, duration: "7.3s" },
  ],
};

export function useDatasetEpisodes(datasetId: string): DatasetEpisodes {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const eps = mockEpisodesMap[datasetId] || mockEpisodesMap["lerobot/pusht"] || [];
      setEpisodes(eps);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [datasetId]);

  return { episodes, loading, totalEpisodes: episodes.length };
}
