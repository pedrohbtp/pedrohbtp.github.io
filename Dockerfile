FROM jekyll/jekyll:4.2.0

COPY Gemfile .
COPY Gemfile.lock .
RUN gem install bundler
RUN bundle install
CMD ["jekyll", "serve"]
