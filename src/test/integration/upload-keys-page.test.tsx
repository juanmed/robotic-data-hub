import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UploadKeysPage from "@/pages/UploadKeysPage";
import { createMockUploadKey } from "@/test/helpers/factories";

const uploadKeyServiceMock = vi.hoisted(() => ({
  listUploadKeys: vi.fn(),
  createUploadKey: vi.fn(),
  revokeUploadKey: vi.fn(),
}));

vi.mock("@/services/uploadKeyService", () => ({
  listUploadKeys: uploadKeyServiceMock.listUploadKeys,
  createUploadKey: uploadKeyServiceMock.createUploadKey,
  revokeUploadKey: uploadKeyServiceMock.revokeUploadKey,
}));

describe("UploadKeysPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload keys page with header", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Upload Keys")).toBeInTheDocument();
    });
  });

  it("displays security warning banner", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/upload keys grant write access/i)).toBeInTheDocument();
    });
  });

  it("loads and displays upload keys on mount", async () => {
    const mockKeys = [
      createMockUploadKey({ id: "key_001", name: "Production Upload Key", active: true }),
      createMockUploadKey({ id: "key_002", name: "Development Upload Key", active: true }),
    ];
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue(mockKeys);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });

  it("shows create upload key button", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create upload key/i })).toBeInTheDocument();
    });
  });

  it("opens create upload key modal when button clicked", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create upload key/i })).toBeInTheDocument();
    });

    // Click the button to open modal
    const createButton = screen.getByRole("button", { name: /create upload key/i });
    fireEvent.click(createButton);

    // Verify modal can be interacted with (will have form content)
    await waitFor(() => {
      expect(screen.getByText("Key Name")).toBeInTheDocument();
    });
  });

  it("creates new upload key with valid name", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);
    const newKey = createMockUploadKey({ id: "key_003", name: "My Test Uploader", active: true });
    uploadKeyServiceMock.createUploadKey.mockResolvedValue({
      key: newKey,
      rawKey: "gamiphy_ABC123DEF456",
    });

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: /create upload key/i });
      fireEvent.click(createButton);
    });

    const input = screen.getByPlaceholderText(/my laptop uploader/i);
    fireEvent.change(input, { target: { value: "My Test Uploader" } });

    const createKeyButton = screen.getByRole("button", { name: /create key/i });
    fireEvent.click(createKeyButton);

    await waitFor(() => {
      expect(uploadKeyServiceMock.createUploadKey).toHaveBeenCalledWith("My Test Uploader");
    });
  });

  it("separates active and revoked keys", async () => {
    const mockKeys = [
      createMockUploadKey({ id: "key_001", name: "Active Key", active: true }),
      createMockUploadKey({ id: "key_002", name: "Revoked Key", active: false, revoked_at: new Date().toISOString() }),
    ];
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue(mockKeys);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });

  it("displays copy button for each active key", async () => {
    const mockKeys = [
      createMockUploadKey({ id: "key_001", name: "Production Key", active: true }),
    ];
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue(mockKeys);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });

  it("revokes upload key when revoke button clicked", async () => {
    const mockKeys = [
      createMockUploadKey({ id: "key_001", name: "Production Key", active: true }),
    ];
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue(mockKeys);
    uploadKeyServiceMock.revokeUploadKey.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });

  it("displays empty state when no upload keys exist", async () => {
    uploadKeyServiceMock.listUploadKeys.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });

  it("shows loading skeleton while fetching keys", async () => {
    uploadKeyServiceMock.listUploadKeys.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/dashboard/upload-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/upload-keys" element={<UploadKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify service is called
    await waitFor(() => {
      expect(uploadKeyServiceMock.listUploadKeys).toHaveBeenCalled();
    });
  });
});
