"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { postHref } from "@/lib/site";

/** public/search-ko.json 항목 (scripts/build-search.mjs가 빌드 전에 생성) */
interface SearchItem {
  title: string;
  slug: string;
  summary: string;
  date: string;
  tags: string[];
}

// 한 번 받은 인덱스는 페이지 이동 사이에도 재사용
let indexPromise: Promise<SearchItem[]> | null = null;
function loadIndex() {
  indexPromise ??= fetch("/search-ko.json")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

function matches(p: SearchItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.title.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export default function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    loadIndex().then(setItems);
  }, []);

  const results = useMemo(
    () => (items ?? []).filter((p) => matches(p, q)).slice(0, 8),
    [items, q],
  );

  useEffect(() => setIdx(0), [q]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[idx]) {
      onClose();
      router.push(postHref(results[idx].slug));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="글 검색"
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-background w-full max-w-[560px] overflow-hidden rounded-xl border shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-4">
          <i className="bi bi-search text-muted-foreground text-sm" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="제목, 내용, 태그로 검색"
            aria-label="검색어"
            className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-[15px] outline-none"
          />
          <kbd className="text-muted-foreground rounded border px-1.5 font-mono text-[10px]">
            esc
          </kbd>
        </div>
        <ul className="m-0 max-h-[50vh] list-none overflow-y-auto p-2">
          {items === null ? (
            <li className="text-muted-foreground px-3 py-8 text-center text-sm">불러오는 중…</li>
          ) : results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-8 text-center text-sm">결과가 없습니다.</li>
          ) : (
            results.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={postHref(p.slug)}
                  onClick={onClose}
                  onMouseEnter={() => setIdx(i)}
                  className={cn("block rounded-md px-3 py-2.5", i === idx && "bg-muted")}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        i === idx && "text-brand",
                      )}
                    >
                      {p.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                      {p.date}
                    </span>
                  </div>
                  <p className="text-muted-foreground m-0 mt-0.5 truncate text-xs">{p.summary}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="text-muted-foreground flex gap-4 border-t px-4 py-2 font-mono text-[10px]">
          <span>↑↓ 이동</span>
          <span>↵ 열기</span>
          <span>esc 닫기</span>
        </div>
      </div>
    </div>
  );
}
