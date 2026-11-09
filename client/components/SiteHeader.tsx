"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { HEADER_ID, HEADER_SLOT_ID } from "@/lib/site";
import SearchPalette from "./SearchPalette";

export default function SiteHeader() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // ⌘K / Ctrl+K / "/" 로 검색 열기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        id={HEADER_ID}
        className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur"
      >
        <div className="mx-auto flex h-14 max-w-[880px] items-center gap-4 px-5">
          <Link href="/" className="shrink-0 font-mono text-sm font-medium">
            <span className="text-muted-foreground">~/</span>kimjunyoung
            <span
              aria-hidden
              className="bg-brand ms-0.5 inline-block h-[1em] w-[0.5em] translate-y-[2px] animate-pulse motion-reduce:animate-none"
            />
          </Link>

          <div id={HEADER_SLOT_ID} className="hidden min-w-0 md:block" />

          <div className="ms-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="검색"
              className="bg-muted text-muted-foreground hover:text-foreground flex h-8 items-center gap-2 rounded-md border px-2.5 text-[13px] transition-colors sm:w-48"
            >
              <i className="bi bi-search text-xs" />
              <span className="hidden sm:inline">검색</span>
              <kbd className="ms-auto hidden rounded border px-1.5 font-mono text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>
            {process.env.NEXT_PUBLIC_GITHUB_URL && (
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center"
              >
                <i className="bi bi-github" />
              </a>
            )}
            <button
              type="button"
              aria-label="테마 전환"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center"
            >
              <i className="bi bi-sun dark:hidden" />
              <i className="bi bi-moon-stars hidden dark:inline" />
            </button>
          </div>
        </div>
      </header>

      {paletteOpen && <SearchPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
