import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 80px - 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
    >
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link href="/">목록으로 돌아가기</Link>
    </main>
  );
}
