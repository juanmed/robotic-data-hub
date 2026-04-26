import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChallengeListCard from "@/components/ChallengeListCard";
import type { Challenge } from "@/types";

const baseChallenge: Challenge = {
  id: "ch_001",
  user_id: "usr_001",
  title: "Kitchen manipulation",
  description: "Test",
  status: "draft",
  compensation_amount: 5000,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "",
  conditions: "",
  tags: [],
  submission_count: 0,
  published_at: null,
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const renderCard = (overrides: Partial<Challenge> = {}, handlers = {}) =>
  render(
    <MemoryRouter>
      <ChallengeListCard
        challenge={{ ...baseChallenge, ...overrides }}
        onPublish={vi.fn()}
        onToggleStatus={vi.fn()}
        onClose={vi.fn()}
        onDelete={vi.fn()}
        {...handlers}
      />
    </MemoryRouter>
  );

describe("ChallengeListCard", () => {
  it("renders title and status badge", () => {
    renderCard();
    expect(screen.getByText("Kitchen manipulation")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("shows edit link", () => {
    renderCard();
    expect(screen.getByTestId("edit-btn")).toBeInTheDocument();
  });

  it("shows delete button only for draft", () => {
    renderCard({ status: "draft" });
    expect(screen.getByTestId("delete-btn")).toBeInTheDocument();
  });

  it("hides delete button for active", () => {
    renderCard({ status: "active" });
    expect(screen.queryByTestId("delete-btn")).not.toBeInTheDocument();
  });

  it("shows publish button for draft", () => {
    renderCard({ status: "draft" });
    expect(screen.getByTestId("publish-btn")).toBeInTheDocument();
  });

  it("shows deactivate button for active", () => {
    renderCard({ status: "active" });
    expect(screen.getByTestId("deactivate-btn")).toBeInTheDocument();
  });

  it("shows activate button for inactive", () => {
    renderCard({ status: "inactive" });
    expect(screen.getByTestId("activate-btn")).toBeInTheDocument();
  });

  it("hides actions for closed", () => {
    renderCard({ status: "closed" });
    expect(screen.queryByTestId("publish-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("deactivate-btn")).not.toBeInTheDocument();
  });

  it("shows compensation info", () => {
    renderCard();
    expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
  });

  it("shows submission count", () => {
    renderCard({ submission_count: 5 });
    expect(screen.getByText("5 submissions")).toBeInTheDocument();
  });

  it("calls onPublish when publish clicked", () => {
    const onPublish = vi.fn();
    renderCard({ status: "draft" }, { onPublish });
    fireEvent.click(screen.getByTestId("publish-btn"));
    expect(onPublish).toHaveBeenCalledWith("ch_001");
  });

  it("calls onDelete when delete clicked", () => {
    const onDelete = vi.fn();
    renderCard({ status: "draft" }, { onDelete });
    fireEvent.click(screen.getByTestId("delete-btn"));
    expect(onDelete).toHaveBeenCalledWith("ch_001");
  });
});
