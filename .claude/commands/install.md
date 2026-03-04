# Install Jekyll Dependencies

Install all dependencies needed to build and serve the site locally.

## Steps

Jekyll is managed via rbenv at `/opt/rbenv/versions/3.3.6/bin/`. The Gemfile.lock references
old `github-pages` gems that are not available locally, so we bypass Bundler and install only
the plugins actually required by `_config.yml`.

Run the following commands:

```bash
# 1. Install Jekyll and Bundler (if not already installed)
/opt/rbenv/versions/3.3.6/bin/gem install jekyll bundler

# 2. Install the two plugins declared in _config.yml
/opt/rbenv/versions/3.3.6/bin/gem install jekyll-paginate jekyll-sitemap
```

### Verify

```bash
/opt/rbenv/versions/3.3.6/bin/jekyll --version
# Expected: jekyll 4.x.x
```

> **Note:** You do NOT need to run `bundle install`. The Gemfile.lock pins very old
> `github-pages` versions that conflict with the system Ruby 3.3. Skip Bundler entirely
> and invoke Jekyll directly via its full rbenv path.
