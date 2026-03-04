# frozen_string_literal: true

# ---------------------------------------------------------------------------
# Rake tasks for building and testing pedrohbtp.github.io
#
# Prerequisites (one-time):
#   bundle install          — install Ruby/Jekyll dependencies
#
# Usage:
#   rake build              — build the Jekyll site to _site/
#   rake test               — build then run Playwright E2E tests
#   rake test:e2e           — run Playwright tests (assumes server is running)
#   rake clean              — remove the _site/ build output
# ---------------------------------------------------------------------------

SITE_DIR = '_site'
PLAYWRIGHT = '/opt/node22/bin/playwright'
JEKYLL_CMD = %(RUBYOPT="-E utf-8" PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" bundle _2.7.2_ exec jekyll)

desc 'Build the Jekyll site to _site/'
task :build do
  sh "#{JEKYLL_CMD} build --destination #{SITE_DIR}"
end

namespace :test do
  desc 'Run Playwright E2E tests (server must already be running on port 4000)'
  task :e2e do
    sh "#{PLAYWRIGHT} test"
  end
end

desc 'Build the site and run all E2E tests'
task test: :build do
  Rake::Task['test:e2e'].invoke
end

desc 'Remove the _site/ build directory'
task :clean do
  rm_rf SITE_DIR
  puts "Removed #{SITE_DIR}/"
end

task default: :test
