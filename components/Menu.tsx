import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Menu() {
  return (
    <nav className="sticky top-0 z-10 w-full overflow-hidden bg-theme-lighter">
      <div className="mx-auto flex h-20 w-[var(--container-prose)] max-w-[90%] items-center justify-between">
        <Link href="/" className="flex items-center no-underline hover:no-underline text-title">
          <span className="font-display text-2xl font-bold">
            kimjunyoung
          </span>
        </Link>
        <ul className="flex items-center gap-5 m-0 p-0">
          <li>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm opacity-90 hover:opacity-100 hover:bg-white/10 text-title"
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
