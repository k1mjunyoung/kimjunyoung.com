import Link from "next/link";
import type { Post } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const dateStr = post.date
    ? new Date(post.date).toISOString().slice(0, 10)
    : "";

  const tags = post.categories.filter(
    (c) => c === "full_remote" || c === "ja_required",
  );

  return (
    <Link href={`/post/${post.slug}`} className="mb-5 block no-underline">
      <Card
        className="min-h-[240px] cursor-pointer flex-row items-stretch gap-0 rounded-[4px] border border-[color:var(--color-border)] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-0 transition-[border-color] duration-300 hover:border-[color:var(--color-link-hover)] dark:bg-[rgba(255,255,255,0.04)]"
        style={{ color: "var(--color-text)" }}
      >
        <CardContent className="flex flex-1 flex-col p-0">
          <CardTitle
            className="mb-2 text-[22px] leading-tight font-normal transition-colors duration-300"
            style={{ color: "var(--color-text)" }}
          >
            {post.title}
          </CardTitle>
          <p className="mb-2 text-base">{post.description || ""}</p>
          <CardDescription
            className="mb-1 text-sm"
            style={{ color: "inherit" }}
          >
            <small>
              업데이트 <time dateTime={post.date}>{dateStr}</time>
            </small>
          </CardDescription>
          {tags.length > 0 && (
            <div className="mt-2.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  className="mr-1.5 rounded-full px-2.5 py-1 text-xs text-white"
                  style={{ backgroundColor: "var(--color-theme-grey)" }}
                >
                  {tag === "full_remote" ? "풀 리모트 👌" : "일본어 필요"}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        {post.thumbnail_url && (
          <div
            style={{
              flexShrink: 0,
              width: "240px",
              marginLeft: "16px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail_url}
              alt={post.title}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                margin: 0,
                borderRadius: 0,
              }}
            />
          </div>
        )}
      </Card>
    </Link>
  );
}
