'use client';

import { useEffect, useRef } from 'react';
import { GISCUS } from '@/i18n/translations';

export default function Giscus() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? 'catppuccin_mocha' : 'catppuccin_latte';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', GISCUS.repo);
    script.setAttribute('data-repo-id', GISCUS.repoId);
    script.setAttribute('data-category', GISCUS.category);
    script.setAttribute('data-category-id', GISCUS.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    ref.current.appendChild(script);
  }, []);

  return <div ref={ref} className="giscus" />;
}
