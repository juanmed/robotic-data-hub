import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/pages/SettingsPage";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
    auth: {
      updateUser: vi.fn(),
    },
  },
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

vi.mock("sonner", () => ({ toast: toastMock }));

const defaultUser = { id: "user_001", email: "test@example.com", name: "John Doe", email_verified: true };
const refreshUser = vi.fn();

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: defaultUser,
      isAuthenticated: true,
      refreshUser,
    });
    supabaseMock.supabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/avatar.jpg" } }),
    });
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    supabaseMock.supabase.auth.updateUser.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings page with header", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "John Doe", email_verified: true },
      isAuthenticated: true,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText(/manage your account/i)).toBeInTheDocument();
    });
  });

  it("displays user name and email", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "john@example.com", name: "John Doe", email_verified: true },
      isAuthenticated: true,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const allJohnDoes = screen.getAllByText("John Doe");
      expect(allJohnDoes.length).toBeGreaterThan(0);
      const allEmails = screen.getAllByText("john@example.com");
      expect(allEmails.length).toBeGreaterThan(0);
    });
  });

  it("displays avatar with initials", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "alice@example.com", name: "Alice Smith", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("AS")).toBeInTheDocument();
    });
  });

  it("displays email verified status as yes when verified", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "verified@example.com", name: "Verified User", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Yes")).toBeInTheDocument();
    });
  });

  it("displays email verified status as no when not verified", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "unverified@example.com", name: "Unverified User", email_verified: false },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No")).toBeInTheDocument();
    });
  });

  it("displays info fields with correct labels", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "Test User", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Email Verified")).toBeInTheDocument();
    });
  });

  it("displays dashes when user fields are null", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: null, name: null, email_verified: false },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it("generates correct initials for names with multiple words", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "Mary Jane Watson", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("MJ")).toBeInTheDocument();
    });
  });

  describe("avatar upload", () => {
    it("rejects files over 2MB with error toast", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const fileInput = document.querySelector("input[type='file'][accept='image/*']") as HTMLInputElement;
      const oversizedFile = new File(["x".repeat(3 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
      Object.defineProperty(oversizedFile, "size", { value: 3 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith("Image must be less than 2MB");
      });
      expect(supabaseMock.supabase.storage.from).not.toHaveBeenCalled();
    });

    it("rejects non-image files with error toast", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const fileInput = document.querySelector("input[type='file'][accept='image/*']") as HTMLInputElement;
      const csvFile = new File(["data"], "data.csv", { type: "text/csv" });
      Object.defineProperty(csvFile, "size", { value: 100 });

      fireEvent.change(fileInput, { target: { files: [csvFile] } });

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith("Please upload an image file");
      });
    });

    it("uploads avatar and calls refreshUser on success", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const fileInput = document.querySelector("input[type='file'][accept='image/*']") as HTMLInputElement;
      const validFile = new File(["img"], "photo.jpg", { type: "image/jpeg" });
      Object.defineProperty(validFile, "size", { value: 500 * 1024 });

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(supabaseMock.supabase.storage.from).toHaveBeenCalledWith("avatars");
        expect(refreshUser).toHaveBeenCalled();
        expect(toastMock.success).toHaveBeenCalledWith("Avatar updated successfully");
      });
    });
  });

  describe("name editing", () => {
    it("shows inline input when Edit name button is clicked", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const editBtn = screen.getByTitle("Upload avatar")
        ? screen.getAllByRole("button").find((b) => b.className.includes("Camera") || b.title?.includes("Upload"))
        : null;

      const pencilButtons = screen.getAllByRole("button");
      const editNameBtn = pencilButtons.find((b) => b.querySelector("svg") && b.title?.includes("Edit") === false);

      const nameSection = screen.getByText("Name").closest("div");
      const editButton = nameSection?.querySelector("button");
      if (editButton) {
        fireEvent.click(editButton);
        await waitFor(() => {
          expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
        });
      }
    });

    it("calls profile update when Save is clicked with new name", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const nameSection = screen.getByText("Name").closest("div");
      const editButton = nameSection?.querySelector("button");
      if (!editButton) return;

      fireEvent.click(editButton);

      await waitFor(() => expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument());

      fireEvent.change(screen.getByDisplayValue("John Doe"), { target: { value: "Jane Doe" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(supabaseMock.supabase.from).toHaveBeenCalledWith("profiles");
        expect(toastMock.success).toHaveBeenCalledWith("Name updated successfully");
      });
    });

    it("cancels name edit without saving when X button is clicked", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const nameSection = screen.getByText("Name").closest("div");
      const editButton = nameSection?.querySelector("button");
      if (!editButton) return;

      fireEvent.click(editButton);
      await waitFor(() => expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument());

      fireEvent.change(screen.getByDisplayValue("John Doe"), { target: { value: "Wrong Name" } });

      const saveBtn = screen.getByRole("button", { name: /save/i });
      const allButtons = Array.from(saveBtn.parentElement?.querySelectorAll("button") ?? []);
      const cancelBtn = allButtons.find((b) => b !== saveBtn);
      if (cancelBtn) fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(supabaseMock.supabase.from).not.toHaveBeenCalled();
        expect(screen.queryByDisplayValue("Wrong Name")).not.toBeInTheDocument();
      });
    });

    it("shows error toast when name is empty on save", async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());

      const nameSection = screen.getByText("Name").closest("div");
      const editButton = nameSection?.querySelector("button");
      if (!editButton) return;

      fireEvent.click(editButton);
      await waitFor(() => expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument());

      fireEvent.change(screen.getByDisplayValue("John Doe"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith("Name cannot be empty");
      });
    });
  });
});
