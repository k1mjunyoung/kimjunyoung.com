"use client";

import { useEffect, useRef, useState } from "react";
import { createArticleProcessor } from "@/lib/markdown";

// 글 페이지와 같은 파이프라인을 브라우저에서 돌린다. starry-night 문법 전체가 들어가므로
// 이 컴포넌트는 /write에서만 next/dynamic으로 불러온다.
const processor = createArticleProcessor({
  getOnigurumaUrlFetch: () => new URL("/write/onig.wasm", window.location.href),
});

/**
 * 입력할 때마다 바로 다시 그린다.
 * 렌더링 중에 입력이 또 들어오면 끝난 뒤 최신 값으로 한 번만 더 그린다 (중간 값은 건너뛴다).
 */
export default function LivePreview({ content }: { content: string }) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(content);
  const running = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    latest.current = content;
    // 이미 돌고 있으면 그 루프가 끝날 때 latest를 보고 다시 그린다
    if (running.current) return;

    running.current = true;
    (async () => {
      let rendered: string | undefined;
      while (mounted.current && rendered !== latest.current) {
        rendered = latest.current;
        try {
          const out = rendered.trim() ? String(await processor.process(rendered)) : "";
          if (!mounted.current) return;
          setHtml(out);
          setError(null);
        } catch (e) {
          if (mounted.current) setError((e as Error).message);
        }
      }
    })().finally(() => {
      running.current = false;
    });
  }, [content]);

  if (error) return <p className="text-destructive m-0 text-sm">미리보기를 만들지 못했습니다. {error}</p>;
  if (!html) return <p className="text-muted-foreground m-0 text-sm">본문을 쓰면 여기에 보입니다.</p>;
  return <div className="article max-w-[680px]" dangerouslySetInnerHTML={{ __html: html }} />;
}
