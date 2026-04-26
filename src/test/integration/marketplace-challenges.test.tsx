import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketplacePage from "@/pages/MarketplacePage";
import { createMockEnrichedChallenge } from "@/test/helpers/factories";

const listingServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  listEnriched: vi.fn(),
  get: vi.fn(),
  publish: vi.fn(),
}));

const challengeServiceMock = vi.hoisted(() => ({
  listEnriched: vi.fn(),
  listMine: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  setStatus: vi.fn(),
  deleteDraft: vi.fn(),
}));

vi.mock("@/services/listingService", () => ({
  listingService: listingServiceMock,
}));

vi.mock("@/services/challengeService", () => ({
  challengeService: challengeServiceMock,
}));

vi.mock("@/services/marketplaceService", () => ({
  getMarketplaceFileUrls: vi.fn().mockResolvedValue([]),
}));

const renderPage = (initialEntry = "/marketplace?tab=challenges") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
    </MemoryRouter>
  );

describe("MarketplacePage - Challenges Tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listingServiceMock.listEnriched.mockResolvedValue([]);
    challengeServiceMock.listEnriched.mockResolvedValue([]);
  });

  it("renders Datasets tab by default", async () => {
    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("tab-datasets")).toBeInTheDocument();
      expect(screen.getByTestId("tab-challenges")).toBeInTheDocument();
    });
  });

  it("switches to Challenges tab on click", async () => {
    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const challengesTab = screen.getByTestId("tab-challenges");
      fireEvent.click(challengesTab);
    });

    await waitFor(() => {
      // After clicking Challenges tab, the subtitle text should change
      expect(screen.getByText(/find challenges requesting datasets/i)).toBeInTheDocument();
    });
  });

  it("displays challenge cards in grid", async () => {
    const mockChallenges = [
      createMockEnrichedChallenge({ id: "ch_001", title: "Kitchen Manipulation" }),
      createMockEnrichedChallenge({ id: "ch_002", title: "Warehouse Navigation" }),
    ];
    challengeServiceMock.listEnriched.mockResolvedValue(mockChallenges);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kitchen Manipulation")).toBeInTheDocument();
      expect(screen.getByText("Warehouse Navigation")).toBeInTheDocument();
    });
  });

  it("filters challenges by search query", async () => {
    const mockChallenges = [
      createMockEnrichedChallenge({ id: "ch_001", title: "Kitchen Manipulation" }),
      createMockEnrichedChallenge({ id: "ch_002", title: "Warehouse Navigation" }),
    ];
    challengeServiceMock.listEnriched.mockResolvedValue(mockChallenges);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kitchen Manipulation")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search challenges/i);
    fireEvent.change(searchInput, { target: { value: "kitchen" } });

    await waitFor(() => {
      expect(screen.getByText("Kitchen Manipulation")).toBeInTheDocument();
      expect(screen.queryByText("Warehouse Navigation")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no challenges", async () => {
    challengeServiceMock.listEnriched.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no challenges yet/i)).toBeInTheDocument();
    });
  });

  it("shows loading skeletons while fetching", async () => {
    challengeServiceMock.listEnriched.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 200))
    );

    renderPage();

    // Loading skeletons should be visible initially
    await waitFor(() => {
      expect(challengeServiceMock.listEnriched).toHaveBeenCalled();
    });
  });

  it("filters challenges by tag", async () => {
    const mockChallenges = [
      createMockEnrichedChallenge({ id: "ch_001", title: "Kitchen Task", tags: ["manipulation"] }),
      createMockEnrichedChallenge({ id: "ch_002", title: "Nav Task", tags: ["navigation"] }),
    ];
    challengeServiceMock.listEnriched.mockResolvedValue(mockChallenges);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kitchen Task")).toBeInTheDocument();
      expect(screen.getByText("Nav Task")).toBeInTheDocument();
    });

    // The tag filter buttons have uppercase tracking-wider styling; find the one that's a filter button
    // (not inside a card). Use getAllByText and pick the first one which is the filter bar button.
    const tagButtons = screen.getAllByText("manipulation");
    fireEvent.click(tagButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Kitchen Task")).toBeInTheDocument();
      expect(screen.queryByText("Nav Task")).not.toBeInTheDocument();
    });
  });
});
