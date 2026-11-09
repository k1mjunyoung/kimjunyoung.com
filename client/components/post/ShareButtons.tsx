"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="ms-auto flex items-center gap-1">
      <span className="me-1">공유</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&hashtags=개발자준영&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X에 공유"
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded"
      >
        <i className="bi bi-twitter-x" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label="링크 복사"
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 items-center gap-1.5 rounded px-2"
      >
        <i className={cn("bi", copied ? "bi-check2 text-brand" : "bi-link-45deg")} />
        {copied ? "복사됨" : "링크"}
      </button>
    </div>
  );
}
