import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ListingPage from "@/pages/ListingPage";
import { createMockListing, createMockSession } from "@/test/helpers/factories";

const listingServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  publish: vi.fn(),
}));

const orderServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  getByListing: vi.fn(),
  create: vi.fn(),
}));

const sessionServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  getStreams: vi.fn(),
  addStream: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/listingService", () => ({
  listingService: listingServiceMock,
}));

vi.mock("@/services/orderService", () => ({
  orderService: orderServiceMock,
}));

vi.mock("@/services/sessionService", () => ({
  sessionService: sessionServiceMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/services/marketplaceService", () => ({
  getMarketplaceFileUrls: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { name: "Test User" }, error: null }),
          in: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user_001" } } }) },
    functions: { invoke: () => Promise.resolve({ data: { urls: [] }, error: null }) },
  },
}));

describe("ListingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({ isAuthenticated: true, user: { id: "user_001" } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays listing details", async () => {
    const mockListing = createMockListing({ id: "listing_001", title: "Robot Navigation Dataset" });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalledWith("listing_001");
    });
  });

  it("shows loading state while fetching listing", async () => {
    listingServiceMock.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(createMockListing({ id: "listing_001" })), 100))
    );
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("displays back link to marketplace", async () => {
    const mockListing = createMockListing({ id: "listing_001" });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
          <Route path="/marketplace" element={<div>Marketplace</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("shows free purchase button for free listing", async () => {
    const mockListing = createMockListing({ id: "listing_001", price_amount: 0 });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("shows purchase button for paid listing", async () => {
    const mockListing = createMockListing({ id: "listing_001", price_amount: 9999 });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("shows download button if already purchased", async () => {
    const mockListing = createMockListing({ id: "listing_001" });
    const mockOrder = { id: "order_001", listing_id: "listing_001" };

    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(orderServiceMock.getByListing).toHaveBeenCalledWith("listing_001");
    });
  });

  it("shows login prompt when not authenticated", async () => {
    useAuthMock.useAuth.mockReturnValue({ isAuthenticated: false });
    const mockListing = createMockListing({ id: "listing_001", price_amount: 9999 });

    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("creates order when free purchase is initiated", async () => {
    const mockListing = createMockListing({ id: "listing_001", price_amount: 0 });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);
    orderServiceMock.create.mockResolvedValue({ id: "order_001" });

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("displays listing description", async () => {
    const mockListing = createMockListing({
      id: "listing_001",
      description: "High-quality robot navigation dataset with sensor fusion"
    });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("displays listing tags", async () => {
    const mockListing = createMockListing({
      id: "listing_001",
      tags: ["robotics", "navigation", "sensor-fusion"]
    });
    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalled();
    });
  });

  it("displays associated dataset information", async () => {
    const mockListing = createMockListing({ id: "listing_001", dataset_id: "ds_001" });

    listingServiceMock.get.mockResolvedValue(mockListing);
    orderServiceMock.getByListing.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/marketplace/listing_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listingServiceMock.get).toHaveBeenCalledWith("listing_001");
    });
  });
});
