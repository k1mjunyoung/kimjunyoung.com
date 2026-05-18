# kimjunyoung.com

> [한국어 문서 (Korean)](README.kr.md)

Korean personal blog built with Next.js 15 App Router.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: TailwindCSS v4 (`@theme` CSS variables)
- **Markdown**: `gray-matter` + `unified` pipeline (`rehype-starry-night` code highlighting)
- **Search**: Fuse.js + `public/search-ko.json` (generated at prebuild)
- **Deployment**: Vercel

## Install & Run

1. Clone this repository
2. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
   The prebuild step automatically generates `public/search-ko.json`.

4. Regenerate search index only:
   ```bash
   node scripts/build-search.mjs
   ```

## Deploy to Vercel

Connect the GitHub repository to Vercel. No special build configuration is needed — Vercel detects Next.js automatically.

## Posts

Posts are fetched from Supabase via API at runtime.

## License

The theme is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
