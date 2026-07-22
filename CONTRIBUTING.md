# Contributing to B-Form Upload Tracker

Thank you for your interest in contributing to the B-Form Upload Tracker project! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and professional
- Focus on the work, not the person
- Provide constructive feedback
- Help others succeed

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Git
- A GitHub account

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork locally**
   ```bash
   git clone https://github.com/yourusername/bform-upload-tracker.git
   cd bform-upload-tracker
   ```

3. **Create a development branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

4. **Set up the development environment**
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with your local configuration
   
   # Install dependencies
   npm install
   
   # Set up database
   npm run migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   # Backend runs on http://localhost:5000
   # Frontend runs on http://localhost:3000
   ```

## Development Workflow

### Creating a Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines (see below)
   - Write tests for new functionality
   - Keep commits atomic and descriptive

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -am 'Add feature: description of what was added'
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR against `main`
   - Provide a clear description of the changes
   - Link any related issues
   - Request review from maintainers

## Code Style Guidelines

### JavaScript/Node.js

- Use `const` and `let`, avoid `var`
- Use arrow functions when appropriate
- Max line length: 100 characters (except URLs)
- 2-space indentation
- Use meaningful variable names

### React Components

- Functional components with hooks
- Props validation with PropTypes or TypeScript
- Keep components focused and single-responsibility
- Use descriptive component names

### Database

- Write migrations for all schema changes
- Use proper naming conventions (snake_case for columns)
- Include indexes on frequently queried columns
- Write triggers for audit trails

### CSS/Styling

- Use BEM naming convention
- Mobile-first responsive design
- Use CSS variables for theming
- Ensure WCAG AA accessibility compliance

## Testing

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test happy paths and edge cases
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Commit Message Guidelines

Follow conventional commit format:

```
type(scope): subject

body

footer
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Changes to build process, dependencies, etc.

### Examples
```
feat(filters): add custom date range filtering for periods

Implement custom date range picker in the filter section,
allowing users to select arbitrary date ranges instead of
just predefined periods.

Closes #42
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Pass all checks**
   - All tests pass
   - Linting passes
   - No conflicts with main branch
4. **Request review** from at least one maintainer
5. **Address feedback** and update your PR
6. **Merge** once approved

## Reporting Bugs

### Bug Report Template

```markdown
**Description:**
A clear description of the bug.

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen.

**Actual Behavior:**
What actually happened.

**Screenshots:**
If applicable, add screenshots.

**Environment:**
- Node.js version:
- Browser:
- OS:

**Logs:**
Include any relevant error messages.
```

## Suggesting Enhancements

### Enhancement Request Template

```markdown
**Description:**
Clear description of the requested enhancement.

**Motivation:**
Why is this enhancement needed?

**Proposed Solution:**
Your idea for how to implement it.

**Alternatives Considered:**
Other approaches you've considered.
```

## Documentation

When contributing code:
- Add comments to complex logic
- Update README if user-facing
- Add/update JSDoc comments for functions
- Update API documentation if needed

## Project Structure

```
backend/
├── src/
│   ├── routes/      # API route handlers
│   ├── controllers/ # Business logic
│   ├── models/      # Database models
│   ├── middleware/  # Express middleware
│   └── app.js       # Express app setup

frontend/
├── src/
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks
│   ├── services/   # API services
│   └── App.jsx     # Main app component

database/
├── schema.sql      # Table definitions
├── triggers.sql    # Database triggers
└── indexes.sql     # Index definitions

docs/
├── 1_UI_Mockup.md
├── 2_UI_Specification.md
├── 3_Database_Schema_and_API.md
├── 4_Implementation_Roadmap.md
└── 5_Project_Summary.md
```

## Performance Considerations

- Database: Use indexes for frequently queried columns
- API: Implement pagination for large result sets
- Frontend: Use React.memo for expensive components
- Caching: Cache responses when appropriate

## Security Guidelines

- Never commit credentials or secrets
- Validate all user inputs
- Use prepared statements for SQL queries
- Implement rate limiting on API endpoints
- Keep dependencies updated

## Need Help?

- Check existing issues and PRs
- Read the documentation
- Ask questions in PRs/issues
- Contact maintainers: anil_mourya@outlook.com

---

Thank you for contributing! Your efforts help make the B-Form Upload Tracker better for everyone.
