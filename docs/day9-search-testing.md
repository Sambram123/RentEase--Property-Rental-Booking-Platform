# Day 9 Search Testing

## Environment
- Ensure `server/.env` and `client/.env` are configured.
- Start backend: `npm run dev` in `server`.
- Start frontend: `npm run dev` in `client`.

## API Checks
- `GET /api/properties?q=studio`
- `GET /api/properties?city=Bangalore&state=Karnataka&country=India`
- `GET /api/properties?type=apartment&minPrice=5000&maxPrice=30000`
- `GET /api/properties?bedrooms=2&bathrooms=2`
- `GET /api/properties?amenities=wifi,parking`
- `GET /api/properties?availability=true`
- `GET /api/properties?sort=price_asc&page=1&limit=12`
- `GET /api/properties?sort=price_desc&page=2&limit=12`

## Expected API Behavior
- `data.total`, `data.page`, `data.limit`, `data.totalPages` are returned.
- `data.hasNextPage` / `data.hasPrevPage` are correct.
- No 500 errors for empty or partial filters.

## Frontend Checks
- Search text updates results (debounced).
- Location search updates results (debounced).
- Sort changes do not clear active filters.
- Pagination moves pages while preserving search/filter state.
- URL query matches active search/filter/sort/page.
- Refresh keeps current filtered state.

## Debug Notes
- If results look stale, clear query params and re-apply filters.
- If API is unreachable, fallback cards may render; verify backend logs first.
