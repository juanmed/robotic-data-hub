import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SubmitDatasetModal from "@/components/SubmitDatasetModal";
import type { ChallengeSubmission } from "@/types";

const datasetServiceMock = vi.hoisted(() => ({
  listDatasets: vi.fn(),
}));

const challengeSubmissionServiceMock = vi.hoisted(() => ({
  submit: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/services/datasetService", () => ({
  listDatasets: datasetServiceMock.listDatasets,
}));

vi.mock("@/services/challengeSubmissionService", () => ({
  challengeSubmissionService: challengeSubmissionServiceMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select data-testid="dataset-select" value={value ?? ""} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
}));

const makeSubmission = (overrides: Partial<ChallengeSubmission> = {}): ChallengeSubmission => ({
  id: "sub_001",
  challenge_id: "ch_001",
  dataset_id: "ds_existing",
  submitter_id: "usr_001",
  message: "",
  status: "pending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  challengeId: "ch_001",
  existingSubmissions: [],
  onSubmitted: vi.fn(),
};

describe("SubmitDatasetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    datasetServiceMock.listDatasets.mockResolvedValue([]);
    challengeSubmissionServiceMock.submit.mockResolvedValue({});
  });

  it("does not render dialog content when open=false", () => {
    render(<SubmitDatasetModal {...defaultProps} open={false} />);
    expect(screen.queryByText(/submit dataset/i)).not.toBeInTheDocument();
  });

  it("renders the dialog when open=true", async () => {
    render(<SubmitDatasetModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("loads datasets with status: ready when modal opens", async () => {
    const readyDataset = { id: "ds_001", display_name: "Ready Dataset", status: "ready" };
    const notReadyDataset = { id: "ds_002", display_name: "Processing", status: "processing" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset, notReadyDataset]);

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => {
      const select = screen.getByTestId("dataset-select");
      expect(select.querySelector("option[value='ds_001']")).toBeTruthy();
      expect(select.querySelector("option[value='ds_002']")).toBeFalsy();
    });
  });

  it("excludes datasets already in existingSubmissions", async () => {
    const alreadySubmitted = { id: "ds_already", display_name: "Already Submitted", status: "ready" };
    const fresh = { id: "ds_fresh", display_name: "Fresh Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([alreadySubmitted, fresh]);

    render(
      <SubmitDatasetModal
        {...defaultProps}
        existingSubmissions={[makeSubmission({ dataset_id: "ds_already" })]}
      />
    );

    await waitFor(() => {
      const select = screen.getByTestId("dataset-select");
      expect(select.querySelector("option[value='ds_fresh']")).toBeTruthy();
      expect(select.querySelector("option[value='ds_already']")).toBeFalsy();
    });
  });

  it("shows 'No eligible datasets' when all are submitted or not ready", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/no eligible datasets/i)).toBeInTheDocument();
    });
  });

  it("submit button is disabled when no dataset is selected", async () => {
    const readyDataset = { id: "ds_001", display_name: "My Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset]);

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId("dataset-select")).toBeInTheDocument());

    const submitBtn = screen.getByRole("button", { name: /submit dataset/i });
    expect(submitBtn).toBeDisabled();
  });

  it("calls challengeSubmissionService.submit with correct payload", async () => {
    const readyDataset = { id: "ds_001", display_name: "My Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset]);

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId("dataset-select")).toBeInTheDocument());

    fireEvent.change(screen.getByTestId("dataset-select"), { target: { value: "ds_001" } });

    const textarea = screen.getByPlaceholderText(/explain how your dataset/i);
    fireEvent.change(textarea, { target: { value: "  My message  " } });

    fireEvent.click(screen.getByRole("button", { name: /submit dataset/i }));

    await waitFor(() => {
      expect(challengeSubmissionServiceMock.submit).toHaveBeenCalledWith({
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        message: "My message",
      });
    });
  });

  it("calls onSubmitted and onClose on success", async () => {
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    const readyDataset = { id: "ds_001", display_name: "My Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset]);

    render(
      <SubmitDatasetModal
        {...defaultProps}
        onSubmitted={onSubmitted}
        onClose={onClose}
      />
    );

    await waitFor(() => expect(screen.getByTestId("dataset-select")).toBeInTheDocument());
    fireEvent.change(screen.getByTestId("dataset-select"), { target: { value: "ds_001" } });
    fireEvent.click(screen.getByRole("button", { name: /submit dataset/i }));

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows error toast when submission fails", async () => {
    const readyDataset = { id: "ds_001", display_name: "My Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset]);
    challengeSubmissionServiceMock.submit.mockRejectedValue(new Error("Already submitted"));

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId("dataset-select")).toBeInTheDocument());
    fireEvent.change(screen.getByTestId("dataset-select"), { target: { value: "ds_001" } });
    fireEvent.click(screen.getByRole("button", { name: /submit dataset/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Already submitted");
    });
  });

  it("handles dataset loading failure without crashing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    datasetServiceMock.listDatasets.mockRejectedValue(new Error("Network error"));

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it("trims whitespace from message before submitting", async () => {
    const readyDataset = { id: "ds_001", display_name: "My Dataset", status: "ready" };
    datasetServiceMock.listDatasets.mockResolvedValue([readyDataset]);

    render(<SubmitDatasetModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId("dataset-select")).toBeInTheDocument());
    fireEvent.change(screen.getByTestId("dataset-select"), { target: { value: "ds_001" } });

    const textarea = screen.getByPlaceholderText(/explain how your dataset/i);
    fireEvent.change(textarea, { target: { value: "   trimmed   " } });
    fireEvent.click(screen.getByRole("button", { name: /submit dataset/i }));

    await waitFor(() => {
      expect(challengeSubmissionServiceMock.submit).toHaveBeenCalledWith(
        expect.objectContaining({ message: "trimmed" })
      );
    });
  });
});
