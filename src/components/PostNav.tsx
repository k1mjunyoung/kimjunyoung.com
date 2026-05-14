import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { t } from '@/i18n/translations';

interface PostNavProps {
  prev: Post | null;
  next: Post | null;
}

export default function PostNav({ prev, next }: PostNavProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '10px 0',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          {prev && (
            <>
              &laquo;{' '}
              <Link href={`/post/${prev.slug}`}>
                {prev.title.replace('株式会社', '')}
              </Link>
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {next && (
            <>
              <Link href={`/post/${next.slug}`}>
                {next.title.replace('株式会社', '')}
              </Link>{' '}
              &raquo;
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <small>
          <Link href="/">{t.back}</Link>
        </small>
      </div>
    </>
  );
}
