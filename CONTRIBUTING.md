# Contributing to RentEase

Thank you for your interest in contributing! RentEase is a portfolio project that welcomes improvements.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/RentEase--Property-Rental-Booking-Platform.git`
3. Follow the [Local Setup](README.md#-local-setup) instructions in the README
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

```bash
# Install all dependencies
npm run install:all

# Start dev servers
npm run dev

# Run tests before submitting
npm run test
npm run test:e2e
```

## Code Style

- **JavaScript**: ES Modules (import/export), async/await
- **React**: Functional components, hooks only — no class components
- **Naming**: camelCase for JS, PascalCase for React components
- **Files**: one component per file, filename = component name
- **Comments**: JSDoc for utility functions, inline comments for non-obvious logic

## Pull Request Guidelines

- Keep PRs small and focused on a single concern
- Include a clear description of what changed and why
- Add/update tests if modifying business logic
- Ensure `npm run test` passes before opening a PR
- Link any related issues in the PR description

## Reporting Issues

Open a GitHub Issue with:
- A clear title
- Steps to reproduce (if a bug)
- Expected vs. actual behavior
- Screenshots/error logs if applicable

## License

By contributing, you agree your contributions will be licensed under the MIT License.
