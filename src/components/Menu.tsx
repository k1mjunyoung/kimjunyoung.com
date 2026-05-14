import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Menu() {
  return (
    <nav
      style={{ backgroundColor: 'var(--color-theme-lighter)' }}
      className="sticky top-0 z-10 w-full overflow-hidden"
    >
      <div
        className="flex items-center justify-between h-20"
        style={{ width: 'var(--container-prose)', maxWidth: '90%', margin: '0 auto' }}
      >
        <Link
          href="/"
          style={{ color: 'var(--color-title)' }}
          className="no-underline flex items-center hover:no-underline"
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 'bold' }}>
            kimjunyoung
          </span>
        </Link>
        <ul className="flex items-center gap-5 m-0 p-0">
          <li>
            <Button
              asChild
              variant="ghost"
              size="sm"
              style={{ color: 'var(--color-title)' }}
              className="gap-1.5 text-sm opacity-90 hover:opacity-100 hover:bg-white/10"
            >
              <a href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github" />
                GitHub
              </a>
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
