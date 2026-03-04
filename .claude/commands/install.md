# Install Jekyll Dependencies

Install all dependencies needed to build and serve the site locally.

## Steps

Jekyll is managed via rbenv at `/opt/rbenv/versions/3.3.6/bin/`. Dependencies are managed
via Bundler using the `Gemfile` and `Gemfile.lock`.

Run the following commands:

```bash
# Install the pinned bundler version first (fixes CGI compatibility issue with bundler 4.x)
gem install bundler -v 2.7.2 --no-document

# Install all gem dependencies via Bundler
bundle _2.7.2_ install
```

### Verify

```bash
RUBYOPT="-E utf-8" PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" bundle _2.7.2_ exec jekyll --version
# Expected: jekyll 3.x.x
```
