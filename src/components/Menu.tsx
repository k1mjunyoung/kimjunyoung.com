import Link from 'next/link';
import { t } from '@/i18n/translations';

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
            <small>
              <a
                href={t.linkToGitHub}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-title)' }}
              >
                <i className="bi bi-github" style={{ marginRight: '3px' }} />
                GitHub
              </a>
            </small>
          </li>
        </ul>
      </div>
    </nav>
  );
}
