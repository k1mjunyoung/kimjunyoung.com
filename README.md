# kimjunyoung.com

> [한국어 문서 (Korean)](README.kr.md)

Simple and responsive website for remote work in Japan in Japanese and English.

# Install & Run

1. Clone this repository
2. Install dependencies and run:
   ```bash
   bundle install
   bundle exec jekyll serve
   ```

## Deploy to Cloudflare Pages

### Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare Pages

### Build Configuration

Set the following in your Cloudflare Pages project settings:

| Setting | Value |
|---------|-------|
| Build command | `jekyll build` |
| Build output directory | `_site` |
| Production branch | `main` |

### Environment Variables

Add this environment variable in Cloudflare Pages dashboard:

| Variable | Value | Note |
|----------|-------|------|
| `RUBY_VERSION` | `3.4.4` | Must match `.ruby-version` file |

**Important:** The `.ruby-version` file in this project specifies Ruby 3.4.4. Make sure the `RUBY_VERSION` environment variable matches this version.

### Build Process

Cloudflare Pages will:
1. Install dependencies: `bundle install`
2. Build the Jekyll site: `jekyll build`
3. Deploy the `_site/` directory

All posts are maintained manually in `en/_posts/`, `ja/_posts/`, and `ko/_posts/` directories.

## Languages

- Japanese
- English

## Categories

1. Fully remote jobs: `full_remote`
2. Japanese required remote jobs: `ja_required`

## Contribute to translation

Adding missing Japanese translation is much appreciated.

- In file `/_data/translations.yml`
- Add to the translation key the missing translation in `ja`

## License

The theme is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).