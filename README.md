# kimjunyoung.com

> [한국어 문서 (Korean)](README.kr.md)

Korean personal blog. A monorepo with a Next.js frontend and a Spring Boot backend (backend migration in progress).

## Repository Structure

```
client/    # Next.js 15 frontend
server/    # Spring Boot backend (Gradle)
supabase/  # Database migrations
```

## Tech Stack

### client

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: TailwindCSS v4 (`@theme` CSS variables)
- **Markdown**: `gray-matter` + `unified` pipeline (`rehype-starry-night` code highlighting)
- **Data**: Supabase
- **Search**: `⌘K` / `/` search palette over `public/search-ko.json` (generated at prebuild)
- **Deployment**: Vercel

### server

- Spring Boot 4.0.9, Java 17, Gradle
- Spring Web MVC, Data JPA, Validation, PostgreSQL

## Install & Run

### client

1. Clone this repository
2. Create `client/.env.local` from `client/.env.example`
3. Install dependencies and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
   The prebuild step automatically generates `public/search-ko.json`.

5. Regenerate search index only:
   ```bash
   node scripts/build-search.mjs
   ```

### server

```bash
cd server
./gradlew build
./gradlew bootRun
```

The database connection is not configured yet, so `bootRun` will not start until the datasource settings are added.

## Deploy to Vercel

Connect the GitHub repository to Vercel and set **Root Directory** to `client`. Without it, Vercel cannot find the Next.js project in the repository root.

## Posts

Posts are fetched from Supabase at runtime. Moving post access behind the Spring Boot API is in progress.

## License

The theme is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
