# frozen_string_literal: true

# ---------------------------------------------------------------------------
# Rake tasks for building and testing pedrohbtp.github.io
#
# Prerequisites (one-time):
#   bundle install          — install Ruby/Jekyll dependencies
#   npm install             — install Node/Playwright/Jest dependencies
#
# Usage:
#   rake build              — build the Jekyll site to _site/
#   rake test               — build then run unit tests + E2E tests (default)
#   rake test:unit          — run Jest unit tests (no server needed)
#   rake test:e2e           — run Playwright E2E tests (assumes server is running)
#   rake clean              — remove the _site/ build output
# ---------------------------------------------------------------------------

SITE_DIR = '_site'
PLAYWRIGHT = 'npx playwright'
JEST = 'npx jest'
JEKYLL_CMD = %(RUBYOPT="-E utf-8" PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" bundle _2.7.2_ exec jekyll)

desc 'Build the Jekyll site to _site/'
task :build do
  sh "#{JEKYLL_CMD} build --destination #{SITE_DIR}"
end

namespace :test do
  desc 'Run Jest unit tests (no server needed)'
  task :unit do
    sh "#{JEST} tests/unit"
  end

  desc 'Run Playwright E2E tests (server must already be running on port 4000)'
  task :e2e do
    sh "#{PLAYWRIGHT} test"
  end
end

desc 'Build the site and run all tests (unit + E2E)'
task test: :build do
  Rake::Task['test:unit'].invoke
  Rake::Task['test:e2e'].invoke
end

desc 'Remove the _site/ build directory'
task :clean do
  rm_rf SITE_DIR
  puts "Removed #{SITE_DIR}/"
end

task default: :test
