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

Runs the Playwright E2E suite (40 tests) against all pages:

```bash
# Build site and run all tests (one command)
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test

# Or run tests against an already-running server
/opt/node22/bin/playwright test
```

## Update gems

```bash
bundle _2.7.2_ update
```
