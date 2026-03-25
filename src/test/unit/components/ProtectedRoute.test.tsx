import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";

const mockUseAuth = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => mockUseAuth);

describe("ProtectedRoute", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading spinner while auth is initializing", () => {
    mockUseAuth.useAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", async () => {
    mockUseAuth.useAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login Route")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    mockUseAuth.useAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
