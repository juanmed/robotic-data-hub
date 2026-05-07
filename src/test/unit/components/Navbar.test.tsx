import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => ({ useAuth: vi.fn() }));
const useIsBloggerMock = vi.hoisted(() => ({ useIsBlogger: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/hooks/useAuth', () => useAuthMock);
vi.mock('@/hooks/useIsBlogger', () => useIsBloggerMock);

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children, onSelect, className }: any) => (
    <button className={className} onClick={(e) => onSelect?.(e)}>{children}</button>
  ),
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Jane Doe' },
      logout: vi.fn(),
    });
  });

  it('hides New Post while blogger role is loading', () => {
    useIsBloggerMock.useIsBlogger.mockReturnValue({ isBlogger: false, isLoading: true });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /new post/i })).not.toBeInTheDocument();
  });

  it('hides New Post for non-blogger after loading', () => {
    useIsBloggerMock.useIsBlogger.mockReturnValue({ isBlogger: false, isLoading: false });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /new post/i })).not.toBeInTheDocument();
  });

  it('shows New Post for blogger and navigates on select', () => {
    useIsBloggerMock.useIsBlogger.mockReturnValue({ isBlogger: true, isLoading: false });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const newPost = screen.getByRole('button', { name: /new post/i });
    fireEvent.click(newPost);

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/blog/new');
  });
});
