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

---

## Repository summary

**What this repo is:** Jekyll personal portfolio/blog for Pedro Borges Torres, hosted on GitHub Pages at https://pedrohbtp.github.io. Based on [Beautiful Jekyll](https://github.com/daattali/beautiful-jekyll) with heavy customisation.

### Key files & directories

| Path | Purpose |
|------|---------|
| `_config.yml` | Site metadata, theme colours, plugins, social links, analytics |
| `Gemfile` | Ruby deps: `github-pages` v232, `jekyll-paginate` |
| `Dockerfile` / `docker-compose.yml` | Containerised local dev (Jekyll 4.2.0) |
| `index.html` | Homepage — hero, skills, projects, media, CTAs |
| `chat.html` | In-browser AI chat demo (Transformers.js) |
| `snake-rl.html` | Snake RL game demo (TensorFlow.js) |
| `language-model.html` | PyTorch serverless ML inference demo |
| `aboutme.md` | About page |
| `tags.html` | Blog tag index |
| `_posts/` | Blog posts (only one post currently: 2015-01-04) |
| `_layouts/` | `base`, `default`, `home`, `page`, `post`, `minimal` |
| `_includes/` | Fragments: nav, header, footer, analytics (GA UA-130023632-1, GTM), disqus, social-share |
| `_data/SocialNetworks.yml` | Social platform definitions used by footer/nav |
| `css/main.css` | Primary custom stylesheet (~1 400 lines) |
| `js/main.js` | Dark-mode toggle + smooth scroll (~194 lines) |
| `js/snake.js` | Snake game logic |
| `snake-rl/` | TF.js model files + game sprites/audio |
| `.githooks/commit-msg` | Enforces Conventional Commits locally |
| `.claude/commands/` | `/install` and `/serve` slash commands |

### Tech stack at a glance

- **Jekyll** with `github-pages` gem (served on GitHub Pages)
- **Bootstrap 3** + custom CSS (dark-mode capable, Google Fonts: Inter, DM Sans)
- **jQuery 1.11.2** (legacy)
- **Transformers.js / TensorFlow.js** for in-browser ML demos
- **kramdown** (GFM) + **rouge** for Markdown/code highlighting
- Plugins: `jekyll-paginate` (5 posts/page), `jekyll-sitemap`
- No GitHub Actions CI (`.github/` directory does not exist)

### Important config values

| Setting | Value |
|---------|-------|
| Timezone | America/Vancouver |
| Permalink | `/:year-:month-:day-:title/` |
| Navbar / footer colour | `#1D2B3A` |
| Google Analytics | UA-130023632-1 |
| Build destination (local) | `/home/user/jekyll_site` (outside repo) |
