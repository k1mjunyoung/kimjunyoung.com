'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { ADSENSE_CLIENT, ADSENSE_SLOT } from '@/i18n/translations';

export default function AdSense() {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!insRef.current || insRef.current.offsetWidth === 0) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
