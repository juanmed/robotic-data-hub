import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ChallengeMediaUpload from "@/components/ChallengeMediaUpload";
import type { ChallengeMedia } from "@/types";

const challengeMediaServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  getSignedUrl: vi.fn(),
  upload: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/services/challengeMediaService", () => ({
  challengeMediaService: challengeMediaServiceMock,
}));

const makeMedia = (overrides: Partial<ChallengeMedia> = {}): ChallengeMedia => ({
  id: "med_001",
  challenge_id: "ch_001",
  user_id: "usr_001",
  storage_path: "ch_001/vid.mp4",
  file_name: "vid.mp4",
  content_type: "video/mp4",
  size_bytes: 1024,
  sort_order: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeFile = (name: string, type: string, size = 1024) => {
  const file = new File(["content"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

const renderComponent = (onMediaChange = vi.fn()) =>
  render(
    <ChallengeMediaUpload
      challengeId="ch_001"
      userId="usr_001"
      onMediaChange={onMediaChange}
    />
  );

describe("ChallengeMediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challengeMediaServiceMock.list.mockResolvedValue([]);
    challengeMediaServiceMock.getSignedUrl.mockResolvedValue("https://signed.url/file");
    challengeMediaServiceMock.upload.mockResolvedValue(makeMedia());
    challengeMediaServiceMock.delete.mockResolvedValue(undefined);
  });

  it("loads and displays existing media on mount", async () => {
    const existingMedia = [
      makeMedia({ id: "med_001", file_name: "existing_video.mp4", content_type: "video/mp4" }),
    ];
    challengeMediaServiceMock.list.mockResolvedValue(existingMedia);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("existing_video.mp4")).toBeInTheDocument();
    });
  });

  it("calls onMediaChange with initial media list after load", async () => {
    const onMediaChange = vi.fn();
    const existingMedia = [makeMedia()];
    challengeMediaServiceMock.list.mockResolvedValue(existingMedia);

    render(<ChallengeMediaUpload challengeId="ch_001" userId="usr_001" onMediaChange={onMediaChange} />);

    await waitFor(() => {
      expect(onMediaChange).toHaveBeenCalledWith(existingMedia);
    });
  });

  it("renders upload zone with drag-and-drop text", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/drag & drop videos or images/i)).toBeInTheDocument();
    });
  });

  it("shows 'Uploading...' while upload is in progress", async () => {
    let resolveUpload!: (value: ChallengeMedia) => void;
    challengeMediaServiceMock.upload.mockReturnValue(
      new Promise<ChallengeMedia>((res) => { resolveUpload = res; })
    );

    renderComponent();
    await waitFor(() => expect(challengeMediaServiceMock.list).toHaveBeenCalled());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("test.mp4", "video/mp4");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    resolveUpload(makeMedia());
  });

  it("calls challengeMediaService.upload when valid file is selected", async () => {
    renderComponent();
    await waitFor(() => expect(challengeMediaServiceMock.list).toHaveBeenCalled());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("clip.mp4", "video/mp4");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(challengeMediaServiceMock.upload).toHaveBeenCalledWith("ch_001", "usr_001", file);
    });
  });

  it("rejects files larger than 100MB", async () => {
    renderComponent();
    await waitFor(() => expect(challengeMediaServiceMock.list).toHaveBeenCalled());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const oversizedFile = makeFile("huge.mp4", "video/mp4", 101 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    await new Promise((r) => setTimeout(r, 50));
    expect(challengeMediaServiceMock.upload).not.toHaveBeenCalled();
  });

  it("rejects files that are not image or video", async () => {
    renderComponent();
    await waitFor(() => expect(challengeMediaServiceMock.list).toHaveBeenCalled());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const badFile = makeFile("data.csv", "text/csv");
    fireEvent.change(input, { target: { files: [badFile] } });

    await new Promise((r) => setTimeout(r, 50));
    expect(challengeMediaServiceMock.upload).not.toHaveBeenCalled();
  });

  it("only uploads valid files from a mixed selection", async () => {
    renderComponent();
    await waitFor(() => expect(challengeMediaServiceMock.list).toHaveBeenCalled());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = makeFile("good.mp4", "video/mp4");
    const badFile = makeFile("bad.csv", "text/csv");
    const oversized = makeFile("big.jpg", "image/jpeg", 200 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [validFile, badFile, oversized] } });

    await waitFor(() => {
      expect(challengeMediaServiceMock.upload).toHaveBeenCalledTimes(1);
      expect(challengeMediaServiceMock.upload).toHaveBeenCalledWith("ch_001", "usr_001", validFile);
    });
  });

  it("prevents upload when already at MAX_FILES limit from initial load", async () => {
    const tenMedia = Array.from({ length: 10 }, (_, i) =>
      makeMedia({ id: `med_${i}`, file_name: `vid${i}.mp4` })
    );
    challengeMediaServiceMock.list.mockResolvedValue(tenMedia);

    renderComponent();
    await waitFor(() => expect(screen.getByText("vid0.mp4")).toBeInTheDocument());

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("extra.mp4", "video/mp4");
    fireEvent.change(input, { target: { files: [file] } });

    await new Promise((r) => setTimeout(r, 50));
    expect(challengeMediaServiceMock.upload).not.toHaveBeenCalled();
  });

  it("calls challengeMediaService.delete when delete button is clicked", async () => {
    const media = makeMedia({ id: "med_001", file_name: "del_me.mp4" });
    challengeMediaServiceMock.list.mockResolvedValue([media]);

    renderComponent();
    await waitFor(() => expect(screen.getByText("del_me.mp4")).toBeInTheDocument());

    const deleteButton = document.querySelector("button[class*='rounded-full']") as HTMLElement;
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(challengeMediaServiceMock.delete).toHaveBeenCalledWith("med_001", media.storage_path);
    });
  });

  it("removes deleted item from the displayed list", async () => {
    const media = makeMedia({ id: "med_001", file_name: "remove_me.mp4" });
    challengeMediaServiceMock.list.mockResolvedValue([media]);

    const onMediaChange = vi.fn();
    render(<ChallengeMediaUpload challengeId="ch_001" userId="usr_001" onMediaChange={onMediaChange} />);
    await waitFor(() => expect(screen.getByText("remove_me.mp4")).toBeInTheDocument());

    const deleteButton = document.querySelector("button[class*='rounded-full']") as HTMLElement;
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText("remove_me.mp4")).not.toBeInTheDocument();
    });
    expect(onMediaChange).toHaveBeenLastCalledWith([]);
  });

  it("handles initial list failure gracefully without crashing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    challengeMediaServiceMock.list.mockRejectedValue(new Error("Failed to load"));
    expect(() => renderComponent()).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
    consoleSpy.mockRestore();
  });
});
