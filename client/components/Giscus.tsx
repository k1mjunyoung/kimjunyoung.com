'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

const themeFor = (resolved: string) => (resolved === 'dark' ? 'noborder_dark' : 'noborder_light');

export default function Giscus() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current || !resolvedTheme) return;
    const theme = themeFor(resolvedTheme);

    // 이미 로드됐으면 iframe에 테마만 전달
    if (loaded.current) {
      ref.current
        .querySelector<HTMLIFrameElement>('iframe.giscus-frame')
        ?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
      return;
    }
    loaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', process.env.NEXT_PUBLIC_GISCUS_REPO!);
    script.setAttribute('data-repo-id', process.env.NEXT_PUBLIC_GISCUS_REPO_ID!);
    script.setAttribute('data-category', process.env.NEXT_PUBLIC_GISCUS_CATEGORY!);
    script.setAttribute('data-category-id', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!);
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
  }, [resolvedTheme]);

  return <div ref={ref} className="giscus" />;
}
