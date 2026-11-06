"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { HEADER_ID, HEADER_SLOT_ID } from "@/lib/site";

/**
 * 포스트를 읽는 동안 헤더에 붙는 것들
 * - 헤더 하단 2px 읽기 진행 바
 * - 220px 이상 스크롤하면 헤더 가운데에 글 제목
 */
export default function ReadingChrome({ title }: { title: string }) {
  const [targets, setTargets] = useState<{ header: HTMLElement; slot: HTMLElement } | null>(null);
  const [ratio, setRatio] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    const slot = document.getElementById(HEADER_SLOT_ID);
    if (header && slot) setTargets({ header, slot });

    let raf = 0;
    function update() {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setRatio(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setScrolled(window.scrollY > 220);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!targets) return null;

  return (
    <>
      {createPortal(
        <div
          aria-hidden
          className="bg-brand absolute inset-x-0 -bottom-px h-[2px] origin-left"
          style={{ transform: `scaleX(${ratio})` }}
        />,
        targets.header,
      )}
      {createPortal(
        <span
          aria-hidden
          className={cn(
            "text-muted-foreground block truncate text-[13px] transition-all duration-300",
            scrolled ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <span className="text-border me-3">/</span>
          {title}
        </span>,
        targets.slot,
      )}
    </>
  );
}
