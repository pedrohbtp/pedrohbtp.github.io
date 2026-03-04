# Install Jekyll Dependencies

Install all dependencies needed to build and serve the site locally.

## Steps

Jekyll is managed via rbenv at `/opt/rbenv/versions/3.3.6/bin/`. Dependencies are managed
via Bundler using the `Gemfile` and `Gemfile.lock`.

Run the following commands:

```bash
# Install all gem dependencies via Bundler
bundle install
```

### Verify

```bash
RUBYOPT="-E utf-8" bundle exec jekyll --version
# Expected: jekyll 3.x.x
```
