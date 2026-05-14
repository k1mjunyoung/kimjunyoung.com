import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPosts, getPostBySlug, getPrevNext } from '@/lib/posts';
import { renderMarkdown } from '@/lib/markdown';
import { buildMetadata, articleSchema } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import PostNav from '@/components/PostNav';
import Giscus from '@/components/Giscus';
import AdSense from '@/components/AdSense';
import '@/styles/article.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts('ko').map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return buildMetadata(post);
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.content);
  const { prev, next } = getPrevNext(slug);
  const dateStr = post.date ? post.date.slice(0, 10) : '';

  return (
    <>
      <JsonLd schema={articleSchema(post)} />
      <div
        style={{
          minHeight: 'calc(100vh - 480px)',
          backgroundColor: 'var(--color-background)',
          paddingTop: '30px',
          paddingBottom: '30px',
        }}
      >
        <div
          style={{
            width: 'var(--container-prose)',
            maxWidth: '90%',
            margin: '0 auto',
          }}
        >
          <article>
            <h1
              style={{
                marginTop: '15px',
                color: 'var(--color-theme)',
                lineHeight: 1.25,
                letterSpacing: '-0.025em',
              }}
              className="post-title"
            >
              {post.title}
            </h1>

            <div style={{ marginBottom: '16px' }}>
              {post.commit_url ? (
                <a href={post.commit_url}>
                  <small>
                    업데이트 <time dateTime={post.date}>{dateStr}</time>
                  </small>
                </a>
              ) : (
                <small>
                  업데이트 <time dateTime={post.date}>{dateStr}</time>
                </small>
              )}
            </div>

            <div
              style={{ marginTop: '20px', marginBottom: '50px' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <p>
              <small>
                {post.link && (
                  <>
                    링크:{' '}
                    <a href={post.link} target="_blank" rel="noopener noreferrer">
                      {post.link}
                    </a>
                    <br />
                  </>
                )}
                공유{' '}
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
