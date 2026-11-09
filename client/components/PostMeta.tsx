import { cn } from "@/lib/utils";
import type { PostSummary } from "@/lib/post-meta";

/** 날짜 / 읽는 시간 / #태그 (모노스페이스 한 줄) */
export default function PostMeta({
  post,
  className,
  tagLimit = 3,
  accentTags = false,
}: {
  post: Pick<PostSummary, "date" | "readMin" | "tags">;
  className?: string;
  tagLimit?: number;
  accentTags?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums",
        className,
      )}
    >
      <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
      <span aria-hidden className="text-border">
        /
      </span>
      <span>{post.readMin} min read</span>
      {post.tags.slice(0, tagLimit).map((t) => (
        <span key={t} className={cn(accentTags && "text-brand")}>
          #{t}
        </span>
      ))}
    </div>
  );
}
