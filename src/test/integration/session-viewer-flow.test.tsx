import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionViewerPage from "@/pages/SessionViewerPage";

const useSessionDataMock = vi.hoisted(() => ({
  useSessionData: vi.fn(),
}));
const useDatasetEpisodesMock = vi.hoisted(() => ({
  useDatasetEpisodes: vi.fn(),
}));
const annotationServiceMock = vi.hoisted(() => ({
  annotationService: {
    listBySession: vi.fn(),
  },
}));

vi.mock("@/hooks/useSessionData", () => useSessionDataMock);
vi.mock("@/hooks/useDatasetEpisodes", () => useDatasetEpisodesMock);
vi.mock("@/services/annotationService", () => annotationServiceMock);

describe("session viewer flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionDataMock.useSessionData.mockReturnValue({
      session: {
        id: "ses_001",
        user_id: "usr_1",
        name: "Viewer Session",
        description: "Session for viewer testing",
        status: "completed",
        stream_count: 2,
        total_size_bytes: 1000,
        created_at: "2026-03-25T00:00:00Z",
        updated_at: "2026-03-25T00:00:00Z",
      },
      streams: [
        { id: "str_1", session_id: "ses_001", name: "Camera", type: "video", format: "mp4", file_count: 1 },
        { id: "str_2", session_id: "ses_001", name: "IMU", type: "imu", format: "csv", file_count: 1 },
      ],
      loading: false,
      datasetId: "lerobot/pusht",
      episode: 0,
    });
    useDatasetEpisodesMock.useDatasetEpisodes.mockReturnValue({
      episodes: [{ index: 0, label: "Episode 0", numFrames: 100, duration: "10.0s" }],
      loading: false,
      totalEpisodes: 1,
    });
    annotationServiceMock.annotationService.listBySession.mockResolvedValue([
      {
        id: "ann_1",
        session_id: "ses_001",
        target: "session",
        type: "tag",
        content: "high-quality",
        author: "Alex Chen",
        color: "hsl(45 100% 55%)",
        created_at: "2026-03-25T00:00:00Z",
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the session viewer and opens the visualizer", async () => {
    render(
      <MemoryRouter initialEntries={["/sessions/ses_001/viewer"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions/:id/viewer" element={<SessionViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Viewer Session")).toBeInTheDocument();
    expect(screen.getAllByText("Camera").length).toBeGreaterThan(0);
    expect(screen.getByText("high-quality")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open visualizer/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
  });
});
