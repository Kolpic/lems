# Git Workflow & Contribution Guidelines

Version control, branching strategy, commits, and pull request standards.

## Table of Contents

- [Branch Strategy](#branch-strategy)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)

---

## Branch Strategy

### Main Branches

- **`main`** - Production-ready code, protected
- **`develop`** - Integration branch (if used)

### Feature Branches

```bash
# Branch naming convention:
feat/<feature-name>      # New features
fix/<bug-name>           # Bug fixes
chore/<task-name>        # Maintenance tasks
docs/<doc-name>          # Documentation updates
refactor/<scope>         # Code refactoring
test/<test-name>         # Test additions

# Examples:
feat/history-polling
fix/solana-9-decimals-overflow
chore/cleanup-broadcast-logs
docs/coding-rules
```

### Creating Branches

```bash
# Always branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature

# Make changes and commit
git add .
git commit -m "feat: add polling to History page"

# Push to remote
git push -u origin feat/your-feature
```

---

## Commit Messages

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat: add automatic polling to History page for real-time updates

Implements smart polling that only activates when there are pending
transactions. Uses Page Visibility API to pause when tab is hidden.

# Bug fix
fix: update Solana tokens to 9 decimals and fix overflow in signer service

Addresses precision loss and overflow issues when handling Solana tokens
with 9 decimal places instead of 18.

Fixes #123

# Documentation
docs: add comprehensive coding rules for all languages

Creates coding-rules/ directory with guidelines for TypeScript, Solidity,
Rust, and Go.

# Chore
chore: update dependencies to latest versions

Updates React Query to v5, Anchor to 0.28.0, and Go to 1.24.
```

### Commit Best Practices

1. **One logical change per commit**
2. **Write meaningful commit messages**
3. **Use present tense** ("add feature" not "added feature")
4. **Reference issues** when applicable
5. **Keep commits atomic** - each commit should work independently

---

## Pull Requests

### Creating a PR

1. **Push your branch**

   ```bash
   git push origin feat/your-feature
   ```

2. **Create PR on GitHub**
   - Use descriptive title following conventional commits format
   - Fill out the PR template completely
   - Link related issues

### PR Title Format

```
feat: add automatic polling to History page
fix: resolve token decimal precision issues
docs: create coding rules documentation
```

### PR Description Template

```markdown
## Summary

Brief description of changes

## Changes

- List of changes
- Another change
- etc.

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots/Videos

(if applicable)

## Breaking Changes

(if any)

## Related Issues

Closes #123
Related to #456
```

### PR Checklist

Before requesting review:

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No commented-out code
- [ ] No debugging statements
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

---

## Code Review

### As an Author

**Responsibilities**:

1. Self-review before requesting review
2. Ensure CI passes
3. Respond to feedback promptly
4. Make requested changes
5. Re-request review after changes

**Best Practices**:

- Keep PRs small and focused (< 400 lines ideally)
- Provide context in PR description
- Highlight areas needing special attention
- Be open to feedback

### As a Reviewer

**Review Focus**:

1. **Correctness**: Does it work as intended?
2. **Security**: Are there vulnerabilities?
3. **Performance**: Are there bottlenecks?
4. **Maintainability**: Is it clear and documented?
5. **Testing**: Are edge cases covered?

**Comment Prefixes**:

- `nit:` - Minor style issue, not blocking
- `question:` - Seeking clarification
- `suggestion:` - Optional improvement
- `blocker:` - Must be fixed before merge

**Examples**:

```
nit: Consider using const instead of let here

question: Why are we using setTimeout instead of setInterval?

suggestion: This could be simplified using Array.reduce()

blocker: This function is missing input validation for the address parameter
```

**Review Tone**:

- Be respectful and constructive
- Ask questions rather than making demands
- Suggest improvements, don't just criticize
- Acknowledge good patterns

### Approval Process

1. At least **1 approval** required
2. All CI checks must pass
3. No unresolved conversations
4. Branch up to date with main

---

## Merge Strategy

### Squash and Merge

**Default strategy**: Squash commits into single commit on merge

Benefits:

- Clean commit history on main
- Single commit per feature/fix
- Easy to revert if needed

### When to Use Rebase

For:

- Keeping feature branch up to date
- Cleaning up local commits

```bash
git fetch origin
git rebase origin/main
```

**Never rebase** shared/public branches!

---

## Summary

**Quick Reference**:

1. **Branch**: `feat/feature-name`, `fix/bug-name`
2. **Commit**: Conventional commits format
3. **PR**: Descriptive title, complete template
4. **Review**: Constructive feedback with prefixes
5. **Merge**: Squash and merge to main

For more details, see:

- [General Guidelines](./00-general-guidelines.md)
- [Testing Standards](./06-testing.md)
