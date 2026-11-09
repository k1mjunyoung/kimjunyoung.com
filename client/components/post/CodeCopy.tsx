"use client";

import { useEffect } from "react";

/**
 * 본문 코드 블록의 복사 버튼 처리.
 * 버튼 마크업은 lib/markdown.ts(rehypeArticle)가 서버에서 만들고, 여기서는 클릭만 위임 처리한다.
 */
export default function CodeCopy() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
      if (!btn) return;
      const code = btn.closest(".code-block")?.querySelector("code")?.textContent ?? "";
      navigator.clipboard?.writeText(code.replace(/\n$/, "")).then(() => {
        btn.textContent = "복사됨";
        btn.dataset.done = "";
        setTimeout(() => {
          btn.textContent = "복사";
          delete btn.dataset.done;
        }, 1500);
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
