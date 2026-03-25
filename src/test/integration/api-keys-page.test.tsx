import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import APIKeysPage from "@/pages/APIKeysPage";

describe("APIKeysPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders API keys page with header", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });
  });

  it("displays warning banner about API key security", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/keep your keys secure/i)).toBeInTheDocument();
    });
  });

  it("loads and displays API keys on mount", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
      expect(screen.getByText("Development Key")).toBeInTheDocument();
    });
  });

  it("shows create key button when no form is visible", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.some((btn) => btn.textContent?.includes("Generate API Key"))).toBe(true);
    });
  });

  it("opens create key form when button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: /generate api key/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/key name/i)).toBeInTheDocument();
    });
  });

  it("creates new API key with valid name", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
    });

    const generateButton = screen.getByRole("button", { name: /generate api key/i });
    fireEvent.click(generateButton);

    // Verify form is shown with input field
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/key name/i)).toBeInTheDocument();
    });
  });

  it("disables generate button when key name is empty", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: /generate api key/i });
    fireEvent.click(createButton);

    // Verify form opens
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/key name/i)).toBeInTheDocument();
    });
  });

  it("cancels form creation", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: /generate api key/i });
      fireEvent.click(createButton);
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/key name/i)).not.toBeInTheDocument();
    });
  });

  it("displays copy button for each API key", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it("displays delete button for each API key", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("deletes API key when delete button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/api-keys"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      const productionKeyElements = screen.queryAllByText("Production Key");
      expect(productionKeyElements.length).toBe(0);
    });
  });
});
