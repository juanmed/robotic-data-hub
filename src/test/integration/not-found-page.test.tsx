import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotFound from "@/pages/NotFound";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("NotFound Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("displays 404 error message", async () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("404")).toBeInTheDocument();
      expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });
  });

  it("displays return home link", async () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/return to home/i)).toBeInTheDocument();
    });
  });

  it("returns home link points to root", async () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLink = screen.getByText(/return to home/i);
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("handles various non-existent routes", async () => {
    render(
      <MemoryRouter initialEntries={["/random/deep/path"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("404")).toBeInTheDocument();
    });
  });

  it("renders with proper styling", async () => {
    render(
      <MemoryRouter initialEntries={["/invalid"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    const heading = screen.getByText("404");
    expect(heading).toHaveClass("text-4xl", "font-bold");
  });
});
