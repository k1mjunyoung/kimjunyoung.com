import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

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
    <Link href={`/post/${post.slug}`} className="block no-underline mb-5">
      <Card
        className="flex-row items-stretch rounded-[4px] bg-white ring-0 border border-[color:var(--color-border)] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 gap-0 min-h-[240px] cursor-pointer hover:border-[color:var(--color-link-hover)] dark:bg-[rgba(255,255,255,0.04)] transition-[border-color] duration-300"
        style={{ color: 'var(--color-text)' }}
      >
        <CardContent className="flex-1 p-0 flex flex-col">
          <CardTitle
            className="text-[22px] font-normal leading-tight mb-2 transition-colors duration-300"
            style={{ color: 'var(--color-text)' }}
          >
            {post.title}
          </CardTitle>
          <p className="text-base mb-2">{post.description || ''}</p>
          <CardDescription className="text-sm mb-1" style={{ color: 'inherit' }}>
            <small>
              업데이트 <time dateTime={post.date}>{dateStr}</time>
            </small>
          </CardDescription>
          {tags.length > 0 && (
            <div className="mt-2.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  className="mr-1.5 rounded-full px-2.5 py-1 text-xs text-white"
                  style={{ backgroundColor: 'var(--color-theme-grey)' }}
                >
                  {tag === 'full_remote' ? '풀 리모트 👌' : '일본어 필요'}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
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
      </Card>
    </Link>
  );
}
