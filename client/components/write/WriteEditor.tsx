"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPost, logout, type SaveResult } from "@/app/write/actions";
import type { CommandName, MarkdownEditorHandle } from "./MarkdownEditor";

// CodeMirror는 브라우저에서만 동작한다
const MarkdownEditor = dynamic(() => import("./MarkdownEditor"), {
  ssr: false,
  loading: () => <div className="text-muted-foreground p-5 font-mono text-xs">에디터 불러오는 중…</div>,
});

// 글 페이지와 같은 렌더러를 브라우저에서 돌리는 실시간 미리보기 (starry-night 문법이 커서 /write에서만 불러온다)
const LivePreview = dynamic(() => import("./LivePreview"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground m-0 font-mono text-xs">미리보기 불러오는 중…</p>,
});

const DRAFT_KEY = "write:draft:v1";
const DRAFT_DELAY = 600;

interface Draft {
  title: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  tags: string;
  thumbnailUrl: string;
  content: string;
}

const EMPTY: Draft = {
  title: "",
  slug: "",
  slugTouched: false,
  description: "",
  tags: "",
  thumbnailUrl: "",
  content: "",
};

/** 제목으로 slug 제안. 한글은 그대로 두고 공백은 -, URL에 못 쓰는 문자는 뺀다 */
function suggestSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : null;
  } catch {
    return null;
  }
}

function hasContent(d: Draft): boolean {
  return Boolean(d.title || d.content || d.description || d.tags || d.thumbnailUrl);
}

const TOOLBAR: { name: CommandName; label: string; icon: string; key?: string }[] = [
  { name: "h2", label: "제목 2", icon: "bi-type-h2" },
  { name: "h3", label: "제목 3", icon: "bi-type-h3" },
  { name: "bold", label: "굵게", icon: "bi-type-bold", key: "Ctrl+B" },
  { name: "italic", label: "기울임", icon: "bi-type-italic", key: "Ctrl+I" },
  { name: "strike", label: "취소선", icon: "bi-type-strikethrough", key: "Ctrl+Shift+X" },
  { name: "quote", label: "인용", icon: "bi-quote" },
  { name: "ul", label: "목록", icon: "bi-list-ul" },
  { name: "ol", label: "번호 목록", icon: "bi-list-ol" },
  { name: "code", label: "인라인 코드", icon: "bi-code", key: "Ctrl+E" },
  { name: "codeBlock", label: "코드 블록", icon: "bi-code-square" },
  { name: "link", label: "링크", icon: "bi-link-45deg", key: "Ctrl+K" },
  { name: "image", label: "이미지", icon: "bi-image" },
];

const fieldClass =
  "bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border px-3 text-sm outline-none focus-visible:ring-3 aria-invalid:border-destructive";

export default function WriteEditor() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [saving, startSaving] = useTransition();
  const editor = useRef<MarkdownEditorHandle>(null);

  // 임시 저장본 불러오기 (브라우저에만 있다)
  useEffect(() => {
    const saved = loadDraft();
    if (saved && hasContent(saved)) {
      setDraft(saved);
      setRestored(true);
    }
    setLoaded(true);
  }, []);

  // 임시 저장
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        if (hasContent(draft)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          setSavedAt(
            new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
          );
        } else {
          localStorage.removeItem(DRAFT_KEY);
          setSavedAt(null);
        }
      } catch {
        // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 임시 저장만 건너뛴다
      }
    }, DRAFT_DELAY);
    return () => clearTimeout(id);
  }, [draft, loaded]);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setResult(null);
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "title" && !d.slugTouched) next.slug = suggestSlug(String(value));
      if (key === "slug") next.slugTouched = String(value).length > 0;
      return next;
    });
  }, []);

  const onContent = useCallback((value: string) => update("content", value), [update]);

  function discard() {
    setDraft(EMPTY);
    setRestored(false);
    setResult(null);
  }

  function save(publish: boolean) {
    startSaving(async () => {
      const res = await createPost({
        title: draft.title,
        slug: draft.slug,
        description: draft.description,
        tags: parseTags(draft.tags),
        content: draft.content,
        thumbnailUrl: draft.thumbnailUrl,
        publish,
      }).catch((e: Error): SaveResult => ({ ok: false, error: e.message }));
      setResult(res);
      if (res.ok) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // 무시
        }
        setDraft(EMPTY);
        setRestored(false);
      }
    });
  }

  const tags = parseTags(draft.tags);
  const chars = draft.content.replace(/\s+/g, "").length;
  const canSave = Boolean(draft.title.trim() && draft.slug.trim() && draft.content.trim()) && !saving;

  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-8 pb-16">
      {/* 상단: 상태와 저장 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground font-mono text-xs">~/write</div>
          <h1 className="m-0 mt-1 text-xl font-bold tracking-[-0.03em]">새 글</h1>
        </div>
        <span className="text-muted-foreground font-mono text-xs" aria-live="polite">
          {savedAt ? `임시 저장 ${savedAt}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
          <Button variant="outline" size="sm" disabled={!canSave} onClick={() => save(false)}>
            비공개 저장
          </Button>
          <Button size="sm" disabled={!canSave} onClick={() => save(true)}>
            {saving ? "저장 중…" : "발행"}
          </Button>
        </div>
      </div>

      {(restored || result) && (
        <div className="mt-4 flex flex-col gap-2">
          {restored && !result && (
            <Notice>
              이 브라우저에 임시 저장된 글을 불러왔습니다.
              <button type="button" onClick={discard} className="text-brand ml-2 underline-offset-4 hover:underline">
                버리고 새로 쓰기
              </button>
            </Notice>
          )}
          {result?.ok === true && (
            <Notice>
              {result.published ? "발행했습니다." : "비공개로 저장했습니다."}
              {result.published && (
                <Link href={result.href} className="text-brand ml-2 underline-offset-4 hover:underline">
                  글 보기 →
                </Link>
              )}
            </Notice>
          )}
          {result?.ok === false && (
            <Notice error>
              저장하지 못했습니다. {result.error}
            </Notice>
          )}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="mt-6 grid gap-3 border-t pt-6 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="sr-only">제목</span>
          <input
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="제목"
            className="placeholder:text-muted-foreground/60 w-full bg-transparent text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-bold tracking-[-0.03em] outline-none"
          />
        </label>
        <Field label="slug" hint={draft.slug ? `/post/${draft.slug}` : "제목에서 자동으로 만듭니다"}>
          <input
            value={draft.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="post-slug"
            spellCheck={false}
            className={cn(fieldClass, "font-mono")}
          />
        </Field>
        <Field label="태그" hint="쉼표로 구분">
          <input
            value={draft.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="spring, jpa"
            className={fieldClass}
          />
        </Field>
        <Field label="설명" hint="비우면 본문 앞부분을 요약으로 씁니다">
          <input
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="목록과 검색에 보이는 한 줄 소개"
            className={fieldClass}
          />
        </Field>
        <Field label="썸네일 URL">
          <input
            value={draft.thumbnailUrl}
            onChange={(e) => update("thumbnailUrl", e.target.value)}
            placeholder="https://"
            type="url"
            spellCheck={false}
            className={cn(fieldClass, "font-mono")}
          />
        </Field>
      </div>

      {/* 좁은 화면: 작성/미리보기 전환 */}
      <div role="tablist" aria-label="보기" className="mt-6 flex gap-1 lg:hidden">
        {(["edit", "preview"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
              tab === key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "edit" ? "작성" : "미리보기"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:mt-6 lg:grid-cols-2">
        {/* 편집 */}
        <section
          aria-label="작성"
          className={cn("flex h-[75dvh] min-h-[480px] flex-col overflow-hidden rounded-lg border", tab !== "edit" && "max-lg:hidden")}
        >
          <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
            {TOOLBAR.map((item) => (
              <button
                key={item.name}
                type="button"
                title={item.key ? `${item.label} (${item.key})` : item.label}
                aria-label={item.label}
                onClick={() => editor.current?.run(item.name)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
              >
                <i className={cn("bi text-[15px]", item.icon)} aria-hidden />
              </button>
            ))}
            <span className="text-muted-foreground ml-auto pr-2 font-mono text-[11px]">
              {chars.toLocaleString()}자 · {Math.max(1, Math.round(chars / 500))}분
            </span>
          </div>
          <div className="min-h-0 flex-1">
            {loaded && <MarkdownEditor handleRef={editor} value={draft.content} onChange={onContent} />}
          </div>
        </section>

        {/* 미리보기: 실제 글 페이지와 같은 렌더러와 스타일 */}
        <section
          aria-label="미리보기"
          className={cn("h-[75dvh] min-h-[480px] overflow-y-auto rounded-lg border", tab !== "preview" && "max-lg:hidden")}
        >
          <div className="text-muted-foreground sticky top-0 z-10 border-b bg-background/90 px-5 py-2.5 font-mono text-[11px] backdrop-blur">
            미리보기
          </div>
          <div className="px-5 py-8 sm:px-8">
            {tags.length > 0 && (
              <div className="text-brand flex flex-wrap gap-x-2 font-mono text-xs">
                {tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            )}
            {draft.description.trim() && (
              <p className="text-muted-foreground m-0 mt-3 text-[17px] leading-relaxed">{draft.description}</p>
            )}
            <div className={cn((tags.length > 0 || draft.description.trim()) && "mt-8 border-t pt-8")}>
              <LivePreview content={draft.content} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground flex items-baseline justify-between gap-2 font-mono text-xs">
        {label}
        {hint && <span className="truncate text-[11px] opacity-80">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Notice({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "m-0 rounded-md border px-3 py-2 text-sm",
        error ? "border-destructive/40 text-destructive" : "bg-muted/50",
      )}
    >
      {children}
    </p>
  );
}
