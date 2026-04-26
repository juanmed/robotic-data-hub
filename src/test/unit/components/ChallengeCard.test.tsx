import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChallengeCard from "@/components/ChallengeCard";
import type { EnrichedChallenge } from "@/types";

const baseChallenge: EnrichedChallenge = {
  id: "ch_001",
  user_id: "usr_001",
  title: "Kitchen object manipulation",
  description: "Need datasets of picking and placing kitchen objects",
  status: "active",
  compensation_amount: 5000,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "",
  conditions: "",
  tags: ["manipulation", "kitchen", "UR5"],
  submission_count: 3,
  published_at: new Date().toISOString(),
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator_name: "Juan",
  preview_url: null,
};

const renderCard = (overrides: Partial<EnrichedChallenge> = {}) =>
  render(
    <MemoryRouter>
      <ChallengeCard challenge={{ ...baseChallenge, ...overrides }} />
    </MemoryRouter>
  );

describe("ChallengeCard", () => {
  it("renders title and description", () => {
    renderCard();
    expect(screen.getByText("Kitchen object manipulation")).toBeInTheDocument();
    expect(screen.getByText(/picking and placing/)).toBeInTheDocument();
  });

  it("shows compensation badge with per-dataset label", () => {
    renderCard();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("/dataset")).toBeInTheDocument();
  });

  it("shows lump sum label for challenge compensation", () => {
    renderCard({ compensation_per: "challenge", compensation_amount: 10000 });
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("total")).toBeInTheDocument();
  });

  it("shows Volunteer when compensation is 0", () => {
    renderCard({ compensation_amount: 0 });
    expect(screen.getByText("Volunteer")).toBeInTheDocument();
  });

  it("shows 'No deadline' when deadline is null", () => {
    renderCard();
    expect(screen.getByText("No deadline")).toBeInTheDocument();
  });

  it("shows deadline with days remaining for future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    renderCard({ deadline: future.toISOString() });
    expect(screen.getByText("10d left")).toBeInTheDocument();
  });

  it("shows 'Deadline passed' for past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    renderCard({ deadline: past.toISOString() });
    expect(screen.getByText("Deadline passed")).toBeInTheDocument();
  });

  it("shows submission count", () => {
    renderCard();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders tags", () => {
    renderCard();
    expect(screen.getByText("manipulation")).toBeInTheDocument();
    expect(screen.getByText("kitchen")).toBeInTheDocument();
    expect(screen.getByText("UR5")).toBeInTheDocument();
  });

  it("links to challenge detail page", () => {
    renderCard();
    const link = screen.getByTestId("challenge-card");
    expect(link.closest("a")).toHaveAttribute("href", "/marketplace/challenges/ch_001");
  });

  it("shows creator name", () => {
    renderCard();
    expect(screen.getByText("Juan")).toBeInTheDocument();
  });

  it("shows fallback icon when no preview", () => {
    const { container } = renderCard();
    // Target icon is rendered as fallback
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
