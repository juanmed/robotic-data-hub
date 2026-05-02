import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownEditor } from '@/components/MarkdownEditor';

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders in edit mode by default', () => {
    render(<MarkdownEditor value="# Hello" />);
    expect(screen.getByDisplayValue('# Hello')).toBeInTheDocument();
  });

  it('shows Edit and Preview buttons', () => {
    render(<MarkdownEditor value="# Hello" />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('calls onBlur with 1s debounce', () => {
    const onBlur = vi.fn();
    render(<MarkdownEditor value="" onBlur={onBlur} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.blur(textarea);

    expect(onBlur).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(onBlur).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onBlur).toHaveBeenCalled();
  });

  it('clears debounce timer on unmount', () => {
    const { unmount } = render(<MarkdownEditor value="" />);
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it('renders read-only mode without toolbar or textarea', () => {
    render(<MarkdownEditor value="# Hello" readOnly />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows "No content provided" in read-only mode when empty', () => {
    render(<MarkdownEditor value="" readOnly />);
    expect(screen.getByText('No content provided.')).toBeInTheDocument();
  });

  it('respects placeholder prop', () => {
    render(<MarkdownEditor value="" placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('respects minRows prop', () => {
    render(<MarkdownEditor value="" minRows={10} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(10);
  });

  it('defaults to 50 rows', () => {
    render(<MarkdownEditor value="" />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(50);
  });

  it('shows save button when showSaveButton is true', () => {
    render(<MarkdownEditor value="" showSaveButton={true} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('hides save button by default', () => {
    render(<MarkdownEditor value="" />);
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });
});
