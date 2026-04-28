import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChallengeDetailPage from "@/pages/ChallengeDetailPage";

const challengeServiceMock = vi.hoisted(() => ({
  get: vi.fn(),
  setStatus: vi.fn(),
}));

const challengeMediaServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  getSignedUrl: vi.fn(),
}));

const challengeSubmissionServiceMock = vi.hoisted(() => ({
  listMine: vi.fn(),
  listForChallengeEnriched: vi.fn(),
  updateStatus: vi.fn(),
}));

const datasetServiceMock = vi.hoisted(() => ({
  getDatasetFileUrls: vi.fn(),
}));

const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/services/challengeService", () => ({
  challengeService: challengeServiceMock,
}));

vi.mock("@/services/challengeMediaService", () => ({
  challengeMediaService: challengeMediaServiceMock,
}));

vi.mock("@/services/challengeSubmissionService", () => ({
  challengeSubmissionService: challengeSubmissionServiceMock,
}));

vi.mock("@/services/datasetService", () => ({
  getDatasetFileUrls: datasetServiceMock.getDatasetFileUrls,
}));

vi.mock("@/lib/visualizer", () => ({
  openVisualizer: visualizerMock.openVisualizer,
}));

vi.mock("@/hooks/useAuth", () => useAuthMock);

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/components/SubmitDatasetModal", () => ({
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="submit-dataset-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

const mockChallenge = {
  id: "ch_001",
  user_id: "usr_owner",
  title: "Kitchen Manipulation Challenge",
  description: "We need kitchen datasets for robot training",
  status: "active",
  compensation_amount: 5000,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "Must use UR5 arm",
  conditions: "At least 100 episodes",
  tags: ["kitchen", "manipulation"],
  submission_count: 2,
  published_at: new Date().toISOString(),
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const renderPage = (path = "/marketplace/challenges/ch_001") =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/marketplace/challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="/dashboard/challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ChallengeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_participant", name: "Participant" },
    });
    challengeServiceMock.get.mockResolvedValue(mockChallenge);
    challengeMediaServiceMock.list.mockResolvedValue([]);
    challengeMediaServiceMock.getSignedUrl.mockResolvedValue("https://signed.url/media");
    challengeSubmissionServiceMock.listMine.mockResolvedValue([]);
    challengeSubmissionServiceMock.listForChallengeEnriched.mockResolvedValue([]);
    challengeSubmissionServiceMock.updateStatus.mockResolvedValue(undefined);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);
  });

  it("renders challenge title and description when loaded", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kitchen Manipulation Challenge")).toBeInTheDocument();
      expect(screen.getByText(/We need kitchen datasets/)).toBeInTheDocument();
    });
  });

  it("renders challenge tags", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("kitchen")).toBeInTheDocument();
      expect(screen.getByText("manipulation")).toBeInTheDocument();
    });
  });

  it("shows 'Submit Dataset' button for authenticated non-owner on active challenge", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit dataset/i })).toBeInTheDocument();
    });
  });

  it("also shows 'Submit Dataset' button for owner on active challenge", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit dataset/i })).toBeInTheDocument();
    });
  });

  it("shows 'Sign in to Submit' link for unauthenticated users on active challenge", async () => {
    useAuthMock.useAuth.mockReturnValue({ isAuthenticated: false, user: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in to submit/i })).toBeInTheDocument();
    });
  });

  it("shows 'Challenge Closed' banner when status is closed", async () => {
    challengeServiceMock.get.mockResolvedValue({ ...mockChallenge, status: "closed" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no longer accepting submissions/i)).toBeInTheDocument();
    });
  });

  it("shows 'Challenge Closed' banner when status is inactive", async () => {
    challengeServiceMock.get.mockResolvedValue({ ...mockChallenge, status: "inactive" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no longer accepting submissions/i)).toBeInTheDocument();
    });
  });

  it("shows 'Challenge not found' when challenge is null", async () => {
    challengeServiceMock.get.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Challenge not found.")).toBeInTheDocument();
    });
  });

  it("opens SubmitDatasetModal when Submit Dataset is clicked", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit dataset/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /submit dataset/i }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-dataset-modal")).toBeInTheDocument();
    });
  });

  it("owner sees Manage Challenge controls", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Manage Challenge")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /deactivate/i })).toBeInTheDocument();
    });
  });

  it("calls challengeService.setStatus with 'inactive' when owner clicks Deactivate", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });
    challengeServiceMock.setStatus.mockResolvedValue({ ...mockChallenge, status: "inactive" });

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /deactivate/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() => {
      expect(challengeServiceMock.setStatus).toHaveBeenCalledWith("ch_001", "inactive");
    });
  });

  it("shows Close Permanently dialog when owner clicks the close button", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /close permanently/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /close permanently/i }));

    await waitFor(() => {
      expect(screen.getByText("Close this challenge?")).toBeInTheDocument();
    });
  });

  it("calls challengeService.setStatus with 'closed' when owner confirms close", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });
    challengeServiceMock.setStatus.mockResolvedValue({ ...mockChallenge, status: "closed" });

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /close permanently/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /close permanently/i }));
    await waitFor(() => expect(screen.getByText("Close this challenge?")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /^close challenge$/i }));

    await waitFor(() => {
      expect(challengeServiceMock.setStatus).toHaveBeenCalledWith("ch_001", "closed");
    });
  });

  it("owner sees enriched submissions list", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });
    challengeSubmissionServiceMock.listForChallengeEnriched.mockResolvedValue([
      {
        id: "sub_001",
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        submitter_id: "usr_002",
        dataset_display_name: "Participant's Dataset",
        submitter_name: "Participant Name",
        message: "This fits your needs",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Participant's Dataset")).toBeInTheDocument();
    });
  });

  it("owner can accept a pending submission", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });
    challengeSubmissionServiceMock.listForChallengeEnriched.mockResolvedValue([
      {
        id: "sub_001",
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        submitter_id: "usr_002",
        dataset_display_name: "Participant's Dataset",
        submitter_name: "Participant",
        message: "",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(challengeSubmissionServiceMock.updateStatus).toHaveBeenCalledWith("sub_001", "accepted");
    });
  });

  it("shows status failure toast when setStatus fails", async () => {
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "usr_owner", name: "Owner" },
    });
    challengeServiceMock.setStatus.mockRejectedValue(new Error("Permission denied"));

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /deactivate/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Permission denied");
    });
  });

  it("shows compensation as Volunteer when amount is 0", async () => {
    challengeServiceMock.get.mockResolvedValue({ ...mockChallenge, compensation_amount: 0 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Volunteer")).toBeInTheDocument();
    });
  });
});
