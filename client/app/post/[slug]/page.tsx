import "@/styles/article.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, getPrevNext } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { buildMetadata, articleSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PostNav from "@/components/PostNav";
import Giscus from "@/components/Giscus";
import AdSense from "@/components/AdSense";

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

export default async function PostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.content);
  const { prev, next } = await getPrevNext(slug);
  const dateStr = post.date ? post.date.slice(0, 10) : "";

  return (
    <>
      <JsonLd schema={articleSchema(post)} />
      <div className="bg-background min-h-[calc(100vh-480px)] py-[30px]">
        <div className="mx-auto w-full max-w-3xl px-4">
          <article>
            <h1 className="text-foreground mt-[15px] text-2xl leading-tight font-bold tracking-tight">
              {post.title}
            </h1>

            <div className="mb-4">
              <small>
                업데이트 <time dateTime={post.date}>{dateStr}</time>
              </small>
            </div>

            <div
              className="prose dark:prose-invert mt-5 mb-[50px] max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <p>
              <small>
                공유{" "}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&hashtags=개발자준영&lang=ko&url=${encodeURIComponent(`https://www.kimjunyoung.com/post/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x" />
                </a>
                <br />
                <br />
                <PostNav prev={prev} next={next} />
              </small>
            </p>
          </article>

          <AdSense />
          <Giscus />
        </div>
      </div>
    </>
  );
}
