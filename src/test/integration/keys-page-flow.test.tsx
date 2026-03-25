import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KeysPage from "@/pages/KeysPage";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
}));
const uploadKeyServiceMock = vi.hoisted(() => ({
  listUploadKeys: vi.fn(),
  createUploadKey: vi.fn(),
  revokeUploadKey: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));
vi.mock("@/services/uploadKeyService", () => uploadKeyServiceMock);
vi.mock("@/hooks/use-toast", () => ({ useToast: () => toastMock }));

describe("keys page flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn() },
      configurable: true,
    });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table !== "api_keys") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            then: (resolve: any) =>
              Promise.resolve(
                resolve({
                  data: [
                    {
                      id: "api_1",
                      name: "Production",
                      key_prefix: "gpai_prod_",
                      created_at: "2026-03-25T00:00:00Z",
                    },
                  ],
                  error: null,
                })
              ),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: {}, error: null })),
        })),
      };
    });

    supabaseMock.functions.invoke.mockResolvedValue({
      data: {
        raw_key: "raw-api-key",
        id: "api_new",
        name: "Dev",
        key_prefix: "gpai_dev_",
        created_at: "2026-03-25T00:00:00Z",
      },
      error: null,
    });

    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([
      {
        id: "upl_1",
        user_id: "usr_1",
        name: "Upload Key",
        key_prefix: "gpai_upl_abc****",
        created_at: "2026-03-25T00:00:00Z",
        last_used_at: null,
        revoked_at: null,
        active: true,
      },
    ]);
    uploadKeyServiceMock.createUploadKey.mockResolvedValue({
      rawKey: "raw-upload-key",
      key: {
        id: "upl_2",
        user_id: "usr_1",
        name: "CLI Upload",
        key_prefix: "gpai_upl_zzz****",
        created_at: "2026-03-25T00:00:00Z",
        last_used_at: null,
        revoked_at: null,
        active: true,
      },
    });
    uploadKeyServiceMock.revokeUploadKey.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates an API key and an upload key", async () => {
    render(
      <MemoryRouter initialEntries={["/keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <KeysPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Production")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /generate api key/i }));
    fireEvent.change(screen.getByPlaceholderText(/key name/i), {
      target: { value: "Dev" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^generate$/i }));

    expect(await screen.findByText(/new key created/i)).toBeInTheDocument();

    const uploadTab = screen.getByRole("tab", { name: /upload keys/i });
    fireEvent.mouseDown(uploadTab);
    fireEvent.mouseUp(uploadTab);
    fireEvent.click(uploadTab);
    await waitFor(() => expect(uploadTab).toHaveAttribute("data-state", "active"));

    const createUploadButton = await screen.findByRole("button", { name: /^create upload key$/i });
    fireEvent.click(createUploadButton);
    fireEvent.change(screen.getByPlaceholderText(/my laptop uploader/i), {
      target: { value: "CLI Upload" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create key$/i }));

    await waitFor(() => expect(uploadKeyServiceMock.createUploadKey).toHaveBeenCalledWith("CLI Upload"));
    expect(await screen.findByText("CLI Upload")).toBeInTheDocument();
  });
});
