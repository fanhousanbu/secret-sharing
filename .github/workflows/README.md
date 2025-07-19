# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing, coverage checking, and deployment.

## Workflows Overview

### 1. `test.yml` - Test and Coverage
**Purpose**: Runs tests and checks coverage thresholds on every push and PR.

**Triggers**:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

**Actions**:
- Installs dependencies
- Runs tests with coverage
- Fails if coverage thresholds are not met
- Uploads coverage reports to Codecov

**Coverage Thresholds**:
- Statements: 65%
- Branches: 50%
- Functions: 55%
- Lines: 65%

### 2. `deploy.yml` - Deploy to GitHub Pages
**Purpose**: Builds and deploys the application to GitHub Pages.

**Triggers**:
- Push to `main` branch

**Actions**:
- Runs tests and coverage checks
- Builds the application
- Deploys to GitHub Pages

### 3. `coverage-badge.yml` - Coverage Report
**Purpose**: Provides detailed coverage reports in Pull Requests.

**Triggers**:
- Pull requests to `main` or `master` branches

**Actions**:
- Runs tests with coverage
- Extracts coverage data
- Comments on PR with detailed coverage report
- Shows coverage status for each metric

## Coverage Report Example

When a PR is created, the coverage workflow will automatically comment with a table like this:

```markdown
## 📊 Test Coverage Report

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| **Statements** | 69.54% | 65% | ✅ |
| **Branches** | 51.27% | 50% | ✅ |
| **Functions** | 56.31% | 55% | ✅ |
| **Lines** | 69.52% | 65% | ✅ |

**Overall Status**: ✅ Coverage meets requirements
```

## README Badges

The main README.md includes several badges that show project status:

- **Test Coverage**: Shows current coverage percentage
- **Build Status**: Links to GitHub Actions
- **Deploy Status**: Shows deployment status
- **License**: MIT license badge
- **TypeScript**: TypeScript version
- **React**: React version

## Branch Protection

To ensure code quality, set up branch protection rules:

1. Go to Repository Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Add status check: `Test and Coverage`
   - Require pull request reviews before merging
   - Require 1 approval
   - Dismiss stale PR approvals when new commits are pushed

## Local Development

Before pushing code, run these commands locally:

```bash
# Run tests
npm test

# Check coverage
npm run test:cov

# Verify coverage thresholds
npm run check:cov
```

## Troubleshooting

### Coverage Not Meeting Thresholds
1. Check which files have low coverage
2. Add more test cases
3. Ensure all branches are covered
4. Remove unused code

### CI/CD Failures
1. Check GitHub Actions logs
2. Ensure all tests pass
3. Verify coverage meets requirements
4. Check for linting errors

### PR Comments Not Appearing
1. Ensure the workflow is triggered on PR
2. Check workflow permissions
3. Verify the PR is to main/master branch 