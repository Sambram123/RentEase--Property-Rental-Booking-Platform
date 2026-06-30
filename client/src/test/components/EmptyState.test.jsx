/**
 * EmptyState component tests.
 * Tests conditional rendering of emoji, icon, title, description, and action button.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No properties found" />);
    expect(screen.getByText('No properties found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search filters."
      />
    );
    expect(screen.getByText('Try adjusting your search filters.')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="No results" />);
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument();
  });

  it('renders emoji when provided', () => {
    render(<EmptyState title="Empty" emoji="🏠" />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('renders action button when action and actionLabel are provided', () => {
    const action = vi.fn();
    render(<EmptyState title="Empty" action={action} actionLabel="Browse Properties" />);
    expect(screen.getByRole('button', { name: 'Browse Properties' })).toBeInTheDocument();
  });

  it('calls action callback when button is clicked', () => {
    const action = vi.fn();
    render(<EmptyState title="Empty" action={action} actionLabel="Try Again" />);
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when only action is provided (no label)', () => {
    const action = vi.fn();
    render(<EmptyState title="Empty" action={action} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses compact padding class when compact=true', () => {
    const { container } = render(<EmptyState title="Compact" compact={true} />);
    expect(container.firstChild).toHaveClass('py-12');
  });

  it('uses full padding class by default', () => {
    const { container } = render(<EmptyState title="Full" />);
    expect(container.firstChild).toHaveClass('py-20');
  });
});
