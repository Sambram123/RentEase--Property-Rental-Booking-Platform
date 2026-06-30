/**
 * PropertyCard component tests.
 * Tests rendering, price display, location, and navigation link.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropertyCard from '../../components/PropertyCard';

// Mock react-icons to avoid SVG issues in jsdom
vi.mock('react-icons/fi', () => ({
  FiMapPin: () => <span data-testid="icon-map-pin" />,
  FiStar: () => <span data-testid="icon-star" />,
}));

// Mock LazyImage to avoid complex intersection observer logic
vi.mock('../../components/LazyImage', () => ({
  default: ({ src, alt }) => <img src={src} alt={alt} />,
}));

// Mock formatPrice utility
vi.mock('../../utils/constants', () => ({
  formatPrice: (price) => `₹${price.toLocaleString('en-IN')}`,
}));

const mockProperty = {
  _id: 'prop-123',
  title: 'Cozy Studio in Mumbai',
  city: 'Mumbai',
  price: 15000,
  bedrooms: 1,
  bathrooms: 1,
  images: ['https://example.com/image.jpg'],
  rating: 4.5,
  reviewsCount: 12,
  availability: true,
};

const renderCard = (property = mockProperty) =>
  render(
    <MemoryRouter>
      <PropertyCard property={property} />
    </MemoryRouter>
  );

describe('PropertyCard', () => {
  it('renders the property title', () => {
    renderCard();
    expect(screen.getByText('Cozy Studio in Mumbai')).toBeInTheDocument();
  });

  it('renders the property city/location', () => {
    renderCard();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  it('renders bedrooms and bathrooms', () => {
    renderCard();
    expect(screen.getByText(/1 bed/i)).toBeInTheDocument();
    expect(screen.getByText(/1 bath/i)).toBeInTheDocument();
  });

  it('renders the rating when > 0', () => {
    renderCard();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('does not render rating badge when rating is 0', () => {
    renderCard({ ...mockProperty, rating: 0 });
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('renders a link pointing to /properties/:id', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/prop-123');
  });

  it('shows Unavailable badge when availability is false', () => {
    renderCard({ ...mockProperty, availability: false });
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('does not show Unavailable badge when available', () => {
    renderCard();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });

  it('falls back to legacy id field for link href', () => {
    const legacyProp = { ...mockProperty, _id: undefined, id: 'legacy-id-456' };
    renderCard(legacyProp);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/legacy-id-456');
  });

  it('uses placeholder image when images array is empty', () => {
    renderCard({ ...mockProperty, images: [] });
    const img = screen.getByRole('img');
    expect(img.src).toContain('unsplash');
  });
});
