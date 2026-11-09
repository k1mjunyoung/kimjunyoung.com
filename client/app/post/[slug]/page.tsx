import "@/styles/article.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdjacentPosts, getAllPosts, getPostBySlug } from "@/lib/posts";
import { renderArticle } from "@/lib/markdown";
import { postHref, readMinutes, visibleTags } from "@/lib/post-meta";
import { buildMetadata, articleSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PostMeta from "@/components/PostMeta";
import Giscus from "@/components/Giscus";
import AdSense from "@/components/AdSense";
import { TocAside, TocInline } from "@/components/post/Toc";
import ReadingChrome from "@/components/post/ReadingChrome";
import CodeCopy from "@/components/post/CodeCopy";
import ShareButtons from "@/components/post/ShareButtons";
import type { Post } from "@/lib/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return buildMetadata(post);
}

/**
 * 포스트 상세
 * - 메인과 같은 96px gutter 그리드: 왼쪽 여백에 "← 목록", 본문은 680px 한 단
 * - 목차: 1360px 이상은 오른쪽 sticky, 그보다 좁으면 본문 위 접이식
 * - 헤더에 읽기 진행 바와 글 제목 (ReadingChrome)
 */
export default async function PostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [{ html, headings }, { newer, older }] = await Promise.all([
    renderArticle(post.content),
    getAdjacentPosts(slug),
  ]);

  const meta = {
    date: post.date ? post.date.slice(0, 10) : "",
    readMin: readMinutes(post.content),
    tags: visibleTags(post.categories),
  };
  // 상세에서는 직접 쓴 설명만 리드 문단으로 쓴다 (자동 요약은 본문 첫 문장과 겹친다)
  const lead = post.description?.trim();
  const hasToc = headings.length >= 2;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${postHref(post.slug)}`;

  return (
    <>
      <JsonLd schema={articleSchema(post)} />
      <ReadingChrome title={post.title} />
      <CodeCopy />

      <main className="mx-auto max-w-[880px] px-5">
        <article>
          <header className="pt-14 pb-10 sm:grid sm:grid-cols-[96px_1fr] sm:pt-20">
            <div className="mb-6 sm:mb-0 sm:pt-1">
              <Link
                href="/"
                className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
              >
                <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                목록
              </Link>
            </div>
            <div className="min-w-0">
              <PostMeta post={meta} tagLimit={Infinity} accentTags />
              <h1 className="m-0 mt-4 max-w-[22em] text-[clamp(1.75rem,1.2rem+2.2vw,2.6rem)] leading-[1.22] font-bold tracking-[-0.035em] text-balance">
                {post.title}
              </h1>
              {lead && (
                <p className="text-muted-foreground m-0 mt-5 max-w-[36em] text-[17px] leading-relaxed">
                  {lead}
                </p>
              )}
            </div>
          </header>

          <div className="border-t pt-10 sm:grid sm:grid-cols-[96px_1fr] sm:pt-12">
            <div aria-hidden />
            <div className="relative min-w-0">
              {hasToc && <TocInline headings={headings} />}

              <div className="article max-w-[680px]" dangerouslySetInnerHTML={{ __html: html }} />

              {hasToc && <TocAside headings={headings} />}

              <div className="text-muted-foreground mt-14 flex max-w-[680px] flex-wrap items-center gap-x-4 gap-y-3 border-t pt-6 font-mono text-xs">
                {meta.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {meta.tags.map((t) => (
                      <span key={t} className="rounded border px-2 py-0.5">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <ShareButtons title={post.title} url={url} />
              </div>

              <div className="mt-10 max-w-[680px]">
                {/* 글을 옮겨 다닐 때 광고 자리를 새로 만들어 새 광고를 받는다 */}
                <AdSense key={post.slug} />
              </div>
            </div>
          </div>
        </article>

        {(older || newer) && (
          <nav
            aria-label="이전, 다음 글"
            className="mt-16 border-t pt-8 sm:grid sm:grid-cols-[96px_1fr]"
          >
            <div className="text-muted-foreground mb-4 font-mono text-xs sm:mb-0 sm:pt-4">
              더 읽기
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {older ? (
                <NavCard post={older} label="← 이전 글" />
              ) : (
                <span className="hidden sm:block" />
              )}
              {newer && <NavCard post={newer} label="다음 글 →" alignRight />}
            </div>
          </nav>
        )}

        <section className="mt-14 sm:grid sm:grid-cols-[96px_1fr]">
          <h2 className="text-muted-foreground m-0 mb-3 font-mono text-xs font-normal sm:mb-0 sm:pt-1">
            댓글
          </h2>
          <div className="min-w-0">
            <Giscus />
          </div>
        </section>
      </main>
    </>
  );
}

function NavCard({ post, label, alignRight }: { post: Post; label: string; alignRight?: boolean }) {
  return (
    <Link
      href={postHref(post.slug)}
      className={`group hover:bg-muted hover:border-foreground/30 block rounded-lg border px-4 py-4 transition-colors ${alignRight ? "sm:text-right" : ""}`}
    >
      <div className="text-muted-foreground font-mono text-[11px]">{label}</div>
      <div className="group-hover:text-brand mt-1.5 line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em] transition-colors">
        {post.title}
      </div>
    </Link>
  );
}
