import Link from 'next/link';
import type { Post } from '@/lib/posts';

interface PostNavProps {
  prev: Post | null;
  next: Post | null;
}

export default function PostNav({ prev, next }: PostNavProps) {
  return (
    <>
      <div className="flex w-full items-center justify-between py-[10px] text-[0.9rem]">
        <div className="text-left">
          {prev && (
            <>
              &laquo;{' '}
              <Link href={`/post/${prev.slug}`}>
                {prev.title.replace('株式会社', '')}
              </Link>
            </>
          )}
        </div>
        <div className="text-right">
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
      <div className="mt-2 text-center">
        <small>
          <Link href="/">목록으로 돌아가기</Link>
        </small>
      </div>
    </>
  );
}
