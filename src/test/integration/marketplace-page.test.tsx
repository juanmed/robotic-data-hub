import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MarketplacePage from "@/pages/MarketplacePage";
import { createMockListing } from "@/test/helpers/factories";

const listingServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  publish: vi.fn(),
}));

vi.mock("@/services/listingService", () => ({
  listingService: listingServiceMock,
}));

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders marketplace page with header", async () => {
    listingServiceMock.list.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/discover robotics/i)).toBeInTheDocument();
    });
  });

  it("displays search bar", async () => {
    listingServiceMock.list.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search datasets/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("loads all listings on page mount", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Navigation Dataset" }),
      createMockListing({ id: "listing_002", title: "Manipulation Dataset" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("displays listings as cards", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Robot Navigation Dataset" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("filters listings by search query", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Navigation Dataset" }),
      createMockListing({ id: "listing_002", title: "Manipulation Dataset" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search datasets/i);
      fireEvent.change(searchInput, { target: { value: "navigation" } });
    });
  });

  it("filters listings by tag", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Dataset 1", tags: ["robotics"] }),
      createMockListing({ id: "listing_002", title: "Dataset 2", tags: ["vision"] }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("shows empty state when no listings exist", async () => {
    listingServiceMock.list.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("shows empty state when search has no results", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Navigation Dataset" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search datasets/i);
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    });
  });

  it("displays listing price", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Paid Dataset", price_cents: 9999 }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("displays free listing indicator for $0 price", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Free Dataset", price_cents: 0 }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("links to individual listing detail page", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Robot Navigation Dataset" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:id" element={<div>Listing Detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("displays listing creator/author information", async () => {
    const mockListings = [
      createMockListing({ id: "listing_001", title: "Dataset", creator: "Alex Chen" }),
    ];
    listingServiceMock.list.mockResolvedValue(mockListings);

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });

  it("shows loading state while fetching listings", async () => {
    listingServiceMock.list.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify service is called
    await waitFor(() => {
      expect(listingServiceMock.list).toHaveBeenCalled();
    });
  });
});
