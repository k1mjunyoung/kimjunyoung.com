import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { postHref, toSummary, type PostSummary } from "@/lib/post-meta";
import { websiteSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PostMeta from "@/components/PostMeta";

const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
const githubUser = githubUrl?.replace(/\/+$/, "").split("/").pop();
const email = process.env.NEXT_PUBLIC_EMAIL;

const profileLinks = [
  githubUrl && { label: "GitHub", href: githubUrl, icon: "bi-github", external: true },
  email && { label: "Email", href: `mailto:${email}`, icon: "bi-envelope", external: false },
].filter((l): l is { label: string; href: string; icon: string; external: boolean } => !!l);

/**
 * 메인
 * - 최신 글 하나는 크게, 나머지는 연도별로 빠르게 훑는 목록
 * - 연도는 왼쪽 96px 여백(gutter)에 sticky
 */
export default async function IndexPage() {
  const posts = (await getAllPosts()).map(toSummary);
  const [featured, ...rest] = posts;

  const byYear = new Map<string, PostSummary[]>();
  for (const p of rest) {
    const y = p.date.slice(0, 4) || "—";
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }

  return (
    <>
      <JsonLd schema={websiteSchema()} />
      <main className="mx-auto max-w-[880px] px-5">
        {/* 프로필 */}
        <section className="pt-14 pb-10 sm:ps-[96px]">
          <div className="flex items-center gap-4">
            {githubUser && (
              <Image
                src={`https://github.com/${githubUser}.png?size=160`}
                alt=""
                width={72}
                height={72}
                priority
                className="bg-muted size-[72px] shrink-0 rounded-full border object-cover"
              />
            )}
            <div className="min-w-0">
              <h1 className="m-0 text-xl leading-tight font-bold tracking-[-0.02em]">김준영</h1>
              {githubUser && (
                <p className="text-muted-foreground m-0 mt-0.5 font-mono text-sm">@{githubUser}</p>
              )}
              <p className="text-muted-foreground m-0 mt-1 text-sm">
                백엔드 개발자 · 지금까지{" "}
                <span className="text-foreground font-mono">{posts.length}</span>편
              </p>
            </div>
          </div>
          <ul className="m-0 mt-5 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
            {profileLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.external && { target: "_blank", rel: "noopener noreferrer" })}
                  className="hover:text-brand inline-flex items-center gap-1.5 transition-colors"
                >
                  <i className={`bi ${l.icon}`} aria-hidden />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* 최신 글 */}
        {featured && (
          <section className="border-t py-10 sm:grid sm:grid-cols-[96px_1fr]">
            <div className="text-brand mb-3 font-mono text-xs sm:mb-0 sm:pt-1.5">최신 글</div>
            <Link href={postHref(featured.slug)} className="group block">
              <h2 className="group-hover:text-brand m-0 text-[clamp(1.35rem,1.1rem+1vw,1.75rem)] leading-snug font-bold tracking-[-0.02em] text-balance transition-colors">
                {featured.title}
              </h2>
              <p className="text-muted-foreground m-0 mt-3 line-clamp-2 max-w-[40em] text-[15px] leading-relaxed">
                {featured.summary}
              </p>
              <PostMeta post={featured} className="mt-4" />
            </Link>
          </section>
        )}

        {/* 연도별 목록 */}
        {[...byYear].map(([year, list]) => (
          <section key={year} className="border-t pt-6 pb-4 sm:grid sm:grid-cols-[96px_1fr]">
            <div className="mb-2 sm:mb-0">
              <h2 className="text-muted-foreground sticky top-20 m-0 font-mono text-xs font-medium sm:pt-[18px]">
                {year}
              </h2>
            </div>
            <ul className="m-0 list-none p-0">
              {list.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={postHref(p.slug)}
                    className="group hover:bg-muted -mx-3 flex items-baseline gap-4 rounded-md px-3 py-3.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="m-0 text-[16px] leading-snug font-semibold tracking-[-0.01em]">
                          {p.title}
                        </h3>
                        <span
                          aria-hidden
                          className="text-brand shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        >
                          →
                        </span>
                      </div>
                      <p className="text-muted-foreground m-0 mt-1 line-clamp-1 text-sm">
                        {p.summary}
                      </p>
                    </div>
                    <time
                      dateTime={p.date}
                      className="text-muted-foreground hidden shrink-0 font-mono text-xs tabular-nums sm:inline"
                    >
                      {p.date.slice(5).replace("-", ".")}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
