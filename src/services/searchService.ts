import { mockSessions, mockStreams } from "@/data/mockData";
import { annotationService } from "@/services/annotationService";
import type { Session, Stream } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export interface SearchResult {
  session: Session;
  streams: Stream[];
  matchedAnnotations: number;
  previewImage: string;
}

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
];

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    await delay(350);
    const q = query.toLowerCase().trim();

    const results: SearchResult[] = [];

    for (let i = 0; i < mockSessions.length; i++) {
      const session = mockSessions[i];
      const sessionStreams = mockStreams.filter((s) => s.session_id === session.id);

      if (!q) {
        results.push({
          session,
          streams: sessionStreams,
          matchedAnnotations: 0,
          previewImage: PREVIEW_IMAGES[i % PREVIEW_IMAGES.length],
        });
        continue;
      }

      const titleMatch = session.name.toLowerCase().includes(q);
      const descMatch = session.description?.toLowerCase().includes(q);
      const streamTypeMatch = sessionStreams.some(
        (s) => s.type.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );

      // Check annotations
      const annotations = await annotationService.listBySession(session.id);
      const annMatch = annotations.filter((a) => a.content.toLowerCase().includes(q)).length;

      if (titleMatch || descMatch || streamTypeMatch || annMatch > 0) {
        results.push({
          session,
          streams: sessionStreams,
          matchedAnnotations: annMatch,
          previewImage: PREVIEW_IMAGES[i % PREVIEW_IMAGES.length],
        });
      }
    }

    return results;
  },
};
