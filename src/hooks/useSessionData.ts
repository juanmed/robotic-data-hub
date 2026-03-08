import { useState, useEffect } from "react";
import type { Session, Stream } from "@/types";
import { sessionService } from "@/services/sessionService";

interface SessionData {
  session: Session | null;
  streams: Stream[];
  loading: boolean;
  datasetId: string;
  episode: number;
}

const sessionDatasetMap: Record<string, { datasetId: string; episode: number }> = {
  ses_001: { datasetId: "lerobot/pusht", episode: 0 },
  ses_002: { datasetId: "lerobot/aloha_mobile_cabinet", episode: 0 },
  ses_003: { datasetId: "lerobot/aloha_static_cups_open", episode: 0 },
  ses_004: { datasetId: "lerobot/pusht", episode: 3 },
};

export function useSessionData(sessionId: string | undefined): SessionData {
  const [session, setSession] = useState<Session | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const mapping = sessionId ? sessionDatasetMap[sessionId] : undefined;
  const datasetId = mapping?.datasetId || "lerobot/pusht";
  const episode = mapping?.episode || 0;

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    Promise.all([sessionService.get(sessionId), sessionService.getStreams(sessionId)]).then(
      ([s, st]) => {
        setSession(s || null);
        setStreams(st);
        setLoading(false);
      }
    );
  }, [sessionId]);

  return { session, streams, loading, datasetId, episode };
}
