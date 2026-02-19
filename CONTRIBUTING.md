# Contributing to PageWhisper

Thank you for your interest in contributing to PageWhisper!

## 🎯 Development Workflow

### Branching Strategy

We follow a strict Git workflow:

```
main (protected)
  └── Production releases only

develop (integration)
  └── Pre-production integration

feature/sprint-X-description
  └── Feature development

release/vX.Y.Z
  └── Release preparation
```

### Creating a Feature Branch

```bash
# 1. Ensure your develop is up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/sprint-01-core-engine

# 3. Make your changes
git add .
git commit -m "feat: implement DOMExtractor"

# 4. Push to origin
git push origin feature/sprint-01-core-engine
```

## 📝 Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(extractor): implement DOMExtractor class
fix(ai): handle rate limit errors with exponential backoff
docs(readme): update installation instructions
test( cleaner): add tests for CSS minification
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Requirements

- Unit test coverage >80%
- All tests must pass before merging
- New features require tests
- Bug fixes require regression tests

## 📏 Code Style

### Linting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks

We use Husky + lint-staged to automatically:
- Run ESLint on staged files
- Run Prettier on staged files
- Run type checking
- Only allow clean commits

## ✅ PR Guidelines

### Before Submitting

- [ ] Code compiles without errors (`npm run type-check`)
- [ ] All tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Tests added/updated for new features
- [ ] Documentation updated
- [ ] Commits follow convention

### Submitting a PR

1. **Title**: Use conventional commit format
   - Example: `feat(extractor): Implement DOMExtractor class`

2. **Description**: Explain what and why
   - Describe changes
   - Link to related issues
   - Include screenshots if applicable

3. **Checklist**: Add PR template checklist
   - [ ] Tests pass
   - [ ] Linting passes
   - [ ] Documentation updated
   - etc.

### Review Process

1. **Automated Checks**: CI/CD must pass
2. **Code Review**: At least 1 approval required
3. **Resolution**: Address all review comments
4. **Squash & Merge**: Maintainers will squash merge

## 🐛 Bug Reports

### Before Creating a Bug Report

- [ ] Check existing issues
- [ ] Verify bug still exists in latest version
- [ ] Reproduce bug consistently

### Bug Report Template

```markdown
### Description
Brief description of the bug

### Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll down to...
4. See error

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: [e.g. Windows 11, macOS 14]
- Chrome Version: [e.g. 120.0.6099.129]
- Extension Version: [e.g. v0.1.0]

### Screenshots
If applicable, add screenshots

### Console Errors
```
Paste console errors here
```
```

## 💡 Feature Requests

### Before Requesting

- [ ] Check if feature already exists
- [ ] Check if requested in Roadmap
- [ ] Consider if it fits project vision

### Feature Request Template

```markdown
### Problem Description
What problem does this solve?

### Proposed Solution
How should it work?

### Alternatives
What other approaches did you consider?

### Additional Context
Add any other context or screenshots
```

## 📚 Development Setup

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/pagewhisper.git
cd pagewhisper

# Install dependencies
npm install

# Setup git hooks
npm run prepare
```

### Development

```bash
# Development build with HMR
npm run dev

# Watch mode
npm run dev -- --watch

# Build extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select `dist` folder
```

## 🎖️ Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- About page in extension

## 📜 Code of Conduct

Be respectful, constructive, and professional. We're all here to build something great together.

---

**Thank you for contributing to PageWhisper!** 🎉
