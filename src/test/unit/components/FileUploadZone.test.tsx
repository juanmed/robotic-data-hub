import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FileUploadZone from "@/components/FileUploadZone";

describe("FileUploadZone", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(Date, "now").mockReturnValue(1234567890);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("emits an uploaded AssetFile after a file is selected", async () => {
    const onFileUploaded = vi.fn();
    const file = new File(["hello"], "clip.mp4", { type: "video/mp4" });

    render(<FileUploadZone streamId="str_001" onFileUploaded={onFileUploaded} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { files: [file] } });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onFileUploaded).toHaveBeenCalledTimes(1);

    expect(onFileUploaded).toHaveBeenCalledWith(
      expect.objectContaining({
        stream_id: "str_001",
        filename: "clip.mp4",
        size_bytes: file.size,
        content_type: "video/mp4",
        s3_key: "str_001/clip.mp4",
      })
    );
  });
});
