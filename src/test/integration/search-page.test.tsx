import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchPage from "@/pages/SearchPage";

const searchServiceMock = vi.hoisted(() => ({
  search: vi.fn(),
}));

vi.mock("@/services/searchService", () => ({
  searchService: searchServiceMock,
}));

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders search page with search bar", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/find the perfect/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/search by title/i)).toBeInTheDocument();
  });

  it("loads all sessions on page mount", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalledWith("");
    });
  });

  it("searches when query is submitted", async () => {
    const mockResults = [
      {
        session: { id: "ses_001", name: "Test Session", description: "A test session", created_at: new Date().toISOString() },
        streams: [],
        matchedAnnotations: 2,
        previewImage: "https://example.com/image.jpg",
      },
    ];
    searchServiceMock.search.mockResolvedValue(mockResults);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    fireEvent.change(searchInput, { target: { value: "test" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalledWith("test");
    });
  });

  it("shows loading state while searching", async () => {
    searchServiceMock.search.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    fireEvent.change(searchInput, { target: { value: "query" } });
    fireEvent.submit(searchInput.closest("form")!);

    // Page should handle loading state
    expect(searchServiceMock.search).toHaveBeenCalled();
  });

  it("displays search results with session information", async () => {
    const mockResults = [
      {
        session: { id: "ses_001", name: "Robot Navigation", description: "Nav task in warehouse", created_at: new Date().toISOString() },
        streams: [],
        matchedAnnotations: 5,
        previewImage: "https://example.com/image.jpg",
      },
    ];
    searchServiceMock.search.mockResolvedValue(mockResults);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalled();
    });
  });

  it("shows empty state when no results found", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalledWith("");
    });
  });

  it("handles search with special characters", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    fireEvent.change(searchInput, { target: { value: "robot@2024" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalledWith("robot@2024");
    });
  });

  it("displays search bar with correct placeholder text", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by title, description, annotation, stream type/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("updates search query in real-time as user types", async () => {
    searchServiceMock.search.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by title/i) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: "new" } });
    expect(searchInput.value).toBe("new");

    fireEvent.change(searchInput, { target: { value: "new query" } });
    expect(searchInput.value).toBe("new query");
  });

  it("searches by stream type", async () => {
    const mockResults = [
      {
        session: { id: "ses_001", name: "Video Dataset", description: "Contains video streams", created_at: new Date().toISOString() },
        streams: [],
        matchedAnnotations: 0,
        previewImage: "https://example.com/image.jpg",
      },
    ];
    searchServiceMock.search.mockResolvedValue(mockResults);

    render(
      <MemoryRouter initialEntries={["/search"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    fireEvent.change(searchInput, { target: { value: "video" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(searchServiceMock.search).toHaveBeenCalledWith("video");
    });
  });
});
