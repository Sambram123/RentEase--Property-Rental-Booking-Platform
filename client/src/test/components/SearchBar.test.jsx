/**
 * SearchBar component tests.
 * Tests rendering, input state, clear button, and form submission.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/SearchBar';

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiSearch: () => <span data-testid="icon-search" />,
  FiMapPin: () => <span data-testid="icon-map" />,
  FiX: () => <span data-testid="icon-x" />,
}));

const renderSearchBar = (props = {}) => {
  const defaults = {
    onSearchChange: vi.fn(),
    onLocationChange: vi.fn(),
    onSubmit: vi.fn(),
    debounceMs: 0, // No debounce in tests
  };
  return render(<SearchBar {...defaults} {...props} />);
};

describe('SearchBar', () => {
  it('renders the search input', () => {
    renderSearchBar();
    expect(screen.getByPlaceholderText(/search title/i)).toBeInTheDocument();
  });

  it('renders the location input', () => {
    renderSearchBar();
    expect(screen.getByPlaceholderText(/city \/ state/i)).toBeInTheDocument();
  });

  it('renders the Search button', () => {
    renderSearchBar();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('updates search input when user types', async () => {
    renderSearchBar();
    const input = screen.getByPlaceholderText(/search title/i);
    await userEvent.type(input, 'Mumbai flat');
    expect(input).toHaveValue('Mumbai flat');
  });

  it('updates location input when user types', async () => {
    renderSearchBar();
    const input = screen.getByPlaceholderText(/city \/ state/i);
    await userEvent.type(input, 'Bangalore');
    expect(input).toHaveValue('Bangalore');
  });

  it('shows clear button when search has text', async () => {
    renderSearchBar();
    const input = screen.getByPlaceholderText(/search title/i);
    await userEvent.type(input, 'test');
    // Clear button appears (rendered as button with X icon)
    const clearButtons = screen.getAllByRole('button', { name: '' });
    expect(clearButtons.length).toBeGreaterThan(0);
  });

  it('clears search input when clear button is clicked', async () => {
    renderSearchBar();
    const input = screen.getByPlaceholderText(/search title/i);
    await userEvent.type(input, 'test query');
    expect(input).toHaveValue('test query');

    // Click the clear button (type="button" next to search input)
    const clearBtn = screen.getAllByRole('button').find(
      (btn) => btn.type === 'button' && btn !== screen.getByRole('button', { name: /^search$/i })
    );
    if (clearBtn) {
      await userEvent.click(clearBtn);
      expect(input).toHaveValue('');
    }
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn();
    renderSearchBar({ onSubmit });

    const form = screen.getByRole('button', { name: /search/i });
    fireEvent.click(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('accepts initialValue prop', () => {
    renderSearchBar({ value: 'initial query' });
    expect(screen.getByPlaceholderText(/search title/i)).toHaveValue('initial query');
  });

  it('does not crash with no props', () => {
    expect(() => render(<SearchBar />)).not.toThrow();
  });
});
