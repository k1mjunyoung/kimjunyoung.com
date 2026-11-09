"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/markdown";

/** 현재 읽고 있는 제목 id (헤더 아래 120px 선을 지난 마지막 제목) */
function useActiveHeading(headings: Heading[]) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    let raf = 0;
    function update() {
      raf = 0;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 120) current = el.id;
        else break;
      }
      setActiveId(current);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [headings]);

  return activeId;
}

function TocList({ headings, activeId }: { headings: Heading[]; activeId: string | null }) {
  return (
    <ol className="m-0 list-none space-y-0.5 p-0">
      {headings.map((h) => {
        const active = h.id === activeId;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active ? "location" : undefined}
              className={cn(
                "-ms-px block border-s py-1 text-[13px] leading-snug transition-colors",
                h.depth === 3 ? "ps-6" : "ps-3",
                active
                  ? "border-brand text-brand"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** 좁은 화면: 본문 위 접이식 목차 */
export function TocInline({ headings }: { headings: Heading[] }) {
  const activeId = useActiveHeading(headings);
  return (
    <details className="group bg-muted mb-10 rounded-lg border min-[1360px]:hidden">
      <summary className="text-muted-foreground flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-xs [&::-webkit-details-marker]:hidden">
        목차 · {headings.length}
        <i className="bi bi-chevron-down transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t px-4 py-3">
        <TocList headings={headings} activeId={activeId} />
      </div>
    </details>
  );
}

/** 넓은 화면(1360px 이상): 본문 오른쪽 sticky 목차. 부모는 relative여야 한다 */
export function TocAside({ headings }: { headings: Heading[] }) {
  const activeId = useActiveHeading(headings);
  return (
    <aside className="absolute top-0 left-full ms-8 hidden h-full w-48 min-[1360px]:block">
      <nav aria-label="목차" className="sticky top-24">
        <div className="text-muted-foreground mb-3 font-mono text-[11px]">목차</div>
        <TocList headings={headings} activeId={activeId} />
      </nav>
    </aside>
  );
}
