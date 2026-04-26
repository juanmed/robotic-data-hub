import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChallengeStatusBadge from "@/components/ChallengeStatusBadge";

describe("ChallengeStatusBadge", () => {
  it("renders 'Draft' for draft status", () => {
    render(<ChallengeStatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders 'Active' for active status", () => {
    render(<ChallengeStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders 'Inactive' for inactive status", () => {
    render(<ChallengeStatusBadge status="inactive" />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders 'Closed' for closed status", () => {
    render(<ChallengeStatusBadge status="closed" />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("applies green styling for active", () => {
    render(<ChallengeStatusBadge status="active" />);
    const badge = screen.getByTestId("challenge-status-badge");
    expect(badge.className).toContain("green");
  });

  it("applies red styling for closed", () => {
    render(<ChallengeStatusBadge status="closed" />);
    const badge = screen.getByTestId("challenge-status-badge");
    expect(badge.className).toContain("red");
  });

  it("applies yellow styling for inactive", () => {
    render(<ChallengeStatusBadge status="inactive" />);
    const badge = screen.getByTestId("challenge-status-badge");
    expect(badge.className).toContain("yellow");
  });
});
