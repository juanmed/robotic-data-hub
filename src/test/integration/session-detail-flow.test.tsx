import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionDetailPage from "@/pages/SessionDetailPage";

const sessionServiceMock = vi.hoisted(() => ({
  sessionService: {
    get: vi.fn(),
    getStreams: vi.fn(),
    addStream: vi.fn(),
  },
}));

vi.mock("@/services/sessionService", () => sessionServiceMock);

describe("session detail flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionServiceMock.sessionService.get.mockResolvedValue({
      id: "ses_001",
      user_id: "usr_1",
      name: "Warehouse Run",
      description: "A session with streams",
      status: "completed",
      stream_count: 1,
      total_size_bytes: 1000,
      created_at: "2026-03-25T00:00:00Z",
      updated_at: "2026-03-25T00:00:00Z",
    });
    sessionServiceMock.sessionService.getStreams.mockResolvedValue([
      {
        id: "str_001",
        session_id: "ses_001",
        name: "Front RGB",
        type: "video",
        format: "mp4",
        file_count: 1,
        files: [],
      },
    ]);
    sessionServiceMock.sessionService.addStream.mockImplementation(async (_sessionId, data) => ({
      id: "str_002",
      session_id: "ses_001",
      name: data.name,
      type: data.type,
      device_name: data.device_name,
      sample_rate: data.sample_rate,
      format: "mp4",
      file_count: 0,
      files: [],
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads session data and adds a stream", async () => {
    render(
      <MemoryRouter initialEntries={["/sessions/ses_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Warehouse Run")).toBeInTheDocument();
    expect(screen.getByText("Front RGB")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /add stream/i })[0]);
    expect(await screen.findByRole("heading", { name: /add stream/i })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/front rgb camera/i), { target: { value: "Rear Camera" } });
    fireEvent.change(screen.getByPlaceholderText(/intel realsense d435/i), { target: { value: "Intel RealSense" } });
    fireEvent.change(screen.getByPlaceholderText(/30 fps/i), { target: { value: "30 fps" } });
    fireEvent.click(screen.getAllByRole("button", { name: /^add stream$/i })[1]);

    await waitFor(() => expect(sessionServiceMock.sessionService.addStream).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Rear Camera")).toBeInTheDocument();
  });
});
