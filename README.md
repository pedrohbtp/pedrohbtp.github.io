# pedrohbtp.github.io

Personal portfolio/blog for Pedro Borges Torres, hosted on GitHub Pages. Based on [Beautiful Jekyll](https://github.com/daattali/beautiful-jekyll).

## Install

```bash
gem install bundler -v 2.7.2 --no-document
bundle _2.7.2_ install
```

## Serve

```bash
RUBYOPT="-E utf-8" PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" \
  bundle _2.7.2_ exec jekyll serve --port 4000 --destination /home/user/jekyll_site
```

Visit http://localhost:4000. The server auto-regenerates on file changes.

## Test

### Unit tests (Jest) — no server required

```bash
npm run test:unit
```

### E2E tests (Playwright) — builds site and starts server automatically

```bash
npm test
```

### All tests (unit + E2E)

```bash
npm run test:all
```

### Rake equivalents

```bash
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test        # unit + E2E (default)
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test:unit   # unit only
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test:e2e    # E2E only (server must be running)
```

## Update gems

```bash
bundle _2.7.2_ update
```
