import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center bg-background text-muted-foreground">
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Button asChild variant="link" className="text-[--color-link]">
        <Link href="/">목록으로 돌아가기</Link>
      </Button>
    </main>
  );
}
