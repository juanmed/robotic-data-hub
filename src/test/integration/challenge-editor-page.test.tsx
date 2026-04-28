import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChallengeEditorPage from "@/pages/ChallengeEditorPage";

const navigateMock = vi.hoisted(() => vi.fn());

const challengeServiceMock = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/services/challengeService", () => ({
  challengeService: challengeServiceMock,
}));

vi.mock("@/hooks/useAuth", () => useAuthMock);

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/components/ChallengeMediaUpload", () => ({
  default: () => <div data-testid="media-upload" />,
}));

const mockChallenge = {
  id: "ch_001",
  user_id: "usr_001",
  title: "Existing Challenge",
  description: "Existing description",
  status: "draft",
  compensation_amount: 0,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "",
  conditions: "",
  tags: ["manipulation"],
  submission_count: 0,
  published_at: null,
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const renderNew = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/challenges/new"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/dashboard/challenges/new" element={<ChallengeEditorPage />} />
        <Route path="/dashboard/challenges/:id/edit" element={<ChallengeEditorPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderEdit = (id = "ch_001") =>
  render(
    <MemoryRouter initialEntries={[`/dashboard/challenges/${id}/edit`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/dashboard/challenges/:id/edit" element={<ChallengeEditorPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("ChallengeEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "usr_001", name: "Test User", email: "test@test.com" },
      isAuthenticated: true,
    });
    challengeServiceMock.get.mockResolvedValue(mockChallenge);
    challengeServiceMock.create.mockResolvedValue({ ...mockChallenge, id: "ch_new" });
    challengeServiceMock.update.mockResolvedValue(mockChallenge);
    challengeServiceMock.publish.mockResolvedValue({ ...mockChallenge, status: "active" });
  });

  it("renders 'Basic Info' step by default for a new challenge", () => {
    renderNew();
    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Create Challenge")).toBeInTheDocument();
  });

  it("renders title and description inputs on Basic Info step", () => {
    renderNew();
    expect(screen.getByPlaceholderText(/kitchen object manipulation/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the task/i)).toBeInTheDocument();
  });

  it("loads existing challenge data in edit mode", async () => {
    renderEdit();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Challenge")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
  });

  it("navigates to next step when Next is clicked", async () => {
    renderNew();

    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText("Media")).toBeInTheDocument();
    });
  });

  it("Back button returns to previous step", async () => {
    renderNew();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText("Media")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/kitchen object manipulation/i)).toBeInTheDocument();
    });
  });

  it("shows error toast when title is empty and Save Draft is clicked", async () => {
    renderNew();

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Title is required");
    });
  });

  it("calls challengeService.create on Save Draft for new challenge with title", async () => {
    renderNew();

    fireEvent.change(screen.getByPlaceholderText(/kitchen object manipulation/i), {
      target: { value: "New Challenge Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(challengeServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Challenge Title" })
      );
    });
  });

  it("calls challengeService.update on Save Draft for existing challenge", async () => {
    renderEdit();
    await waitFor(() => expect(screen.getByDisplayValue("Existing Challenge")).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue("Existing Challenge"), {
      target: { value: "Updated Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(challengeServiceMock.update).toHaveBeenCalledWith(
        "ch_001",
        expect.objectContaining({ title: "Updated Title" })
      );
    });
  });

  it("navigates to dashboard when challenge is not found in edit mode", async () => {
    challengeServiceMock.get.mockResolvedValue(undefined);
    renderEdit("ch_nonexistent");

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows compensation amount field only when isVolunteer is false", async () => {
    renderNew();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      const compensationLabels = screen.getAllByText("Compensation");
      expect(compensationLabels.length).toBeGreaterThan(0);
    });

    expect(screen.queryByPlaceholderText("0.00")).not.toBeInTheDocument();

    const volunteerSwitch = screen.getByRole("switch");
    fireEvent.click(volunteerSwitch);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    });
  });

  it("calls challengeService.create then publish in new mode on Publish", async () => {
    renderNew();

    fireEvent.change(screen.getByPlaceholderText(/kitchen object manipulation/i), {
      target: { value: "My Challenge" },
    });
    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "A description" },
    });

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /publish challenge/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /publish challenge/i }));

    await waitFor(() => {
      expect(challengeServiceMock.create).toHaveBeenCalled();
      expect(challengeServiceMock.publish).toHaveBeenCalled();
    });
  });

  it("shows 'Already Published' and disables publish button when status is active", async () => {
    challengeServiceMock.get.mockResolvedValue({ ...mockChallenge, status: "active" });
    renderEdit();

    await waitFor(() => expect(screen.getByDisplayValue("Existing Challenge")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      const publishBtn = screen.getByRole("button", { name: /already published/i });
      expect(publishBtn).toBeDisabled();
    });
  });

  it("shows error toast when save fails", async () => {
    challengeServiceMock.update.mockRejectedValue(new Error("Save failed"));
    renderEdit();
    await waitFor(() => expect(screen.getByDisplayValue("Existing Challenge")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Save failed");
    });
  });
});
