"use client";

declare global {
  interface Window {
    adsbygoogle: object[];
  }
}

import { useEffect, useRef } from 'react';
import Script from 'next/script';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT!;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT!;

export default function AdSense() {
  const insRef = useRef<HTMLModElement>(null);
  // 개발 모드 StrictMode는 effect를 두 번 실행한다. push가 두 번 쌓이면 스크립트가
  // 두 번째 push에서 "빈 ins가 없다"는 TagError를 비동기로 던지므로 한 번만 보낸다.
  const pushed = useRef(false);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins || pushed.current || ins.offsetWidth === 0) return;
    // 이미 AdSense가 처리한 자리면 건너뛴다
    if (ins.hasAttribute('data-adsbygoogle-status')) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
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
        className="adsbygoogle block"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
