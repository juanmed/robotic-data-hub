import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MarketplacePage from "@/pages/MarketplacePage";

const listingServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("@/services/listingService", () => ({ listingService: listingServiceMock }));

describe("marketplace flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listingServiceMock.list.mockResolvedValue([
      {
        id: "lst_1",
        user_id: "usr_1",
        session_id: "ses_1",
        title: "Warehouse Navigation Dataset",
        description: "LiDAR and RGB data",
        price_cents: 4900,
        tags: ["lidar", "warehouse", "navigation"],
        download_count: 120,
        published: true,
        created_at: "2026-03-25T00:00:00Z",
        updated_at: "2026-03-25T00:00:00Z",
      },
      {
        id: "lst_2",
        user_id: "usr_1",
        session_id: "ses_2",
        title: "Kitchen Manipulation Set",
        description: "Robotics kitchen data",
        price_cents: 0,
        tags: ["kitchen", "manipulation"],
        download_count: 15,
        published: true,
        created_at: "2026-03-25T00:00:00Z",
        updated_at: "2026-03-25T00:00:00Z",
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("filters listings by search query and tag", async () => {
    render(
      <MemoryRouter initialEntries={["/marketplace"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MarketplacePage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Warehouse Navigation Dataset")).toBeInTheDocument();
    expect(screen.getByText("Kitchen Manipulation Set")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search datasets/i), {
      target: { value: "kitchen" },
    });
    expect(screen.getByText("Kitchen Manipulation Set")).toBeInTheDocument();
    expect(screen.queryByText("Warehouse Navigation Dataset")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "kitchen" }));
    await waitFor(() => expect(screen.getByText("Kitchen Manipulation Set")).toBeInTheDocument());
  });
});
