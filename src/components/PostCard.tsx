import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { t } from '@/i18n/translations';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const dateStr = post.date
    ? new Date(post.date).toISOString().slice(0, 10)
    : '';

  const tags = post.categories.filter(
    (c) => c === 'full_remote' || c === 'ja_required'
  );

  return (
    <Link
      href={`/post/${post.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: '240px',
        color: 'var(--color-text)',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid var(--color-border)',
        marginBottom: '20px',
        padding: '20px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        transition: '0.3s',
        overflow: 'hidden',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
      className="list-item hover:border-[var(--color-link-hover)] dark:bg-[rgba(255,255,255,0.04)]"
    >
      <div style={{ flexGrow: 1 }}>
        <h2
          style={{
            fontSize: '22px',
            transition: '0.3s',
            color: 'var(--color-text)',
            marginBottom: '0.5rem',
          }}
        >
          {post.title}
        </h2>
        <div style={{ fontSize: '16px', marginBottom: '0.5rem' }}>
          {post.description || ''}
        </div>
        <div style={{ marginBottom: '0.25rem' }}>
          <small>
            {t.postUpdatedBy}{' '}
            <time dateTime={post.date}>{dateStr}</time>
          </small>
        </div>
        {tags.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {tags.map((tag) => (
              <small
                key={tag}
                style={{
                  padding: '5px 10px',
                  color: 'white',
                  backgroundColor: 'var(--color-theme-grey)',
                  borderRadius: '50px',
                  marginRight: '5px',
                }}
              >
                {tag === 'full_remote' ? t.postTagFullRemote : t.postTagJaRequired}
              </small>
            ))}
          </div>
        )}
      </div>
      {post.firstImage && (
        <div
          style={{
            flexShrink: 0,
            width: '240px',
            marginLeft: '16px',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.firstImage}
            alt={post.title}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              margin: 0,
              borderRadius: 0,
            }}
          />
        </div>
      )}
    </Link>
  );
}
