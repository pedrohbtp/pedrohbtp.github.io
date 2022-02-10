FROM jekyll/jekyll

COPY Gemfile .
COPY Gemfile.lock .
RUN gem install bundler
RUN bundle install
CMD ["jekyll", "serve"]
