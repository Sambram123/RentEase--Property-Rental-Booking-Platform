# Day 9 Filter + Map Testing

## Filter Sidebar
- Open `Properties` page.
- Toggle filter drawer on mobile.
- Apply combinations:
  - Type + Price
  - Bedrooms + Bathrooms
  - Amenities (multi-select)
  - Availability true/false/all
- Use reset button and verify query params clear.

## Map Integration
- Switch to map view after applying filters.
- Verify map markers update with filtered dataset.
- Click marker and validate property preview/details link.
- Verify grid/map toggles preserve search/filter URL state.

## Regression Checks
- Property details load correctly.
- Booking flow works from property detail page.
- Payment flow still works (order create, verify, success/failure pages).

## Quick Debugging
- Missing markers: listing has no valid coordinates.
- Empty map with active filters: validate filters in URL and API response.
- Incorrect page counts: verify `page`/`limit` query and backend metadata.
