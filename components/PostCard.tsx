import Link from "next/link";
import type { Post } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardAction,
  CardHeader,
} from "@/components/ui/card";

interface PostCardProps {
  post: Post;
}

function extractPreview(content: string, maxLength = 140): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^\s*[-*>]\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + "…"
    : stripped;
}

function extractContentImages(content: string, max = 4): string[] {
  const mdMatches = [...content.matchAll(/!\[.*?\]\((.*?)\)/g)].map(
    (m) => m[1],
  );
  const htmlMatches = [
    ...content.matchAll(/<img[^>]+src=["']([^"']+)["']/g),
  ].map((m) => m[1]);
  return [...mdMatches, ...htmlMatches].slice(0, max);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  const month = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() !== now.getFullYear()
    ? `${date.getFullYear()}년 ${month}`
    : month;
}

export default function PostCard({ post }: PostCardProps) {
  const dateLabel = post.date ? formatDate(post.date) : "";
  const dateStr = post.date
    ? new Date(post.date).toISOString().slice(0, 10)
    : "";

  const contentImages = extractContentImages(post.content);

  const tags = post.categories.filter(
    (c) => c === "full_remote" || c === "ja_required",
  );

  return (
    <div>
      <Link href={`/post/${post.slug}`}>
        <Card className="gap-2 rounded-none border-b py-4 shadow-none ring-0">
          <CardHeader className="px-4">
            <CardTitle>
              {post.title}{" "}
              <small className="text-muted-foreground font-normal">
                <time dateTime={dateStr}>{dateLabel}</time>
              </small>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p>
              {
                // post.description ||
                extractPreview(post.content)
              }
            </p>
          </CardContent>
          <CardContent className="px-4">
            <div className="max-h-32 overflow-hidden"></div>
            {contentImages.length > 0 && (
              <div
                className={[
                  "aspect-video w-full overflow-hidden rounded-md",
                  contentImages.length === 2 &&
                    "grid grid-cols-2 grid-rows-1 gap-0.5",
                  contentImages.length === 3 &&
                    "grid grid-cols-3 grid-rows-1 gap-0.5",
                  contentImages.length >= 4 &&
                    "grid grid-cols-2 grid-rows-2 gap-0.5",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {contentImages.map((src, i) => (
                  <div key={i} className="overflow-hidden">
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div>
                {tags.map((tag) => (
                  <Badge key={tag}>
                    {tag === "full_remote" ? "풀 리모트 👌" : "일본어 필요"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
