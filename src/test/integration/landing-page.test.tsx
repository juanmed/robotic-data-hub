import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "@/pages/LandingPage";

const lovableMock = vi.hoisted(() => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: lovableMock.lovable,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders landing page with hero section", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/gamiphy/i).length).toBeGreaterThan(0);
    });
  });

  it("displays main tagline", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/capture, organize, search, annotate/i)).toBeInTheDocument();
    });
  });

  it("displays enter platform button linking to dashboard", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const enterButton = screen.getByRole("link", { name: /enter platform/i });
      expect(enterButton).toHaveAttribute("href", "/dashboard");
    });
  });

  it("displays explore datasets button linking to marketplace", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<div>Marketplace</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const exploreButton = screen.getByRole("link", { name: /explore datasets/i });
      expect(exploreButton).toHaveAttribute("href", "/marketplace");
    });
  });

  it("displays public beta badge", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/now in public beta/i)).toBeInTheDocument();
    });
  });

  it("displays features section", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/session-centric robotics data/i)).toBeInTheDocument();
      expect(screen.getByText(/multimodal uploads/i)).toBeInTheDocument();
      expect(screen.getByText(/searchable datasets/i)).toBeInTheDocument();
    });
  });

  it("displays google sign-in button", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /get started with google/i })).toBeInTheDocument();
    });
  });

  it("displays browser-based platform feature", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/browser-based platform/i)).toBeInTheDocument();
    });
  });

  it("has proper semantic HTML structure", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    const mainSection = container.querySelector("section");
    expect(mainSection).toBeInTheDocument();
  });

  it("displays annotation tools feature", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/annotation tools/i)).toBeInTheDocument();
    });
  });

  it("displays dataset marketplace feature", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/dataset marketplace/i)).toBeInTheDocument();
    });
  });
});
