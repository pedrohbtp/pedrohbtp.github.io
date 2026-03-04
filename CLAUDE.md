# Claude Code — Project Guidelines

## Commit messages

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Allowed types:

| Type       | Use for                                      |
|------------|----------------------------------------------|
| `feat`     | New feature                                  |
| `fix`      | Bug fix                                      |
| `docs`     | Documentation only                           |
| `style`    | Formatting, whitespace (no logic change)     |
| `refactor` | Code change that is neither feat nor fix     |
| `perf`     | Performance improvement                      |
| `test`     | Adding or updating tests                     |
| `build`    | Build system or external dependencies        |
| `ci`       | CI/CD configuration                          |
| `chore`    | Maintenance tasks                            |
| `revert`   | Reverts a previous commit                    |

### Examples

```
feat(chat): add streaming token output
fix(nav): correct mobile menu z-index
docs: add local dev setup to CLAUDE.md
chore: update jekyll-paginate gem
```

## Git hooks setup

Activate the local `commit-msg` hook after cloning (one-time):

```bash
git config core.hooksPath .githooks
```

This enforces the Conventional Commits format locally before every commit.
A GitHub Actions workflow (`.github/workflows/conventional-commits.yml`)
runs the same check on every pull request.

## Local dev server

See `/install` and `/serve` slash commands under `.claude/commands/`.
