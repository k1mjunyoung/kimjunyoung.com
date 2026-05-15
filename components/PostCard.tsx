import Link from "next/link";
import type { Post } from "@/lib/posts";
import { extractPreview, extractContentImages } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PostCardProps {
  post: Post;
}

const GRID_CLASS: Record<number, string> = {
  2: "grid grid-cols-2 grid-rows-1 gap-0.5",
  3: "grid grid-cols-3 grid-rows-1 gap-0.5",
  4: "grid grid-cols-2 grid-rows-2 gap-0.5",
};

export default function PostCard({ post }: PostCardProps) {
  const dateLabel = post.date ? formatDate(post.date) : "";
  const dateStr = post.date
    ? new Date(post.date).toISOString().slice(0, 10)
    : "";

  const contentImages = extractContentImages(post.content);
  const gridClass = GRID_CLASS[Math.min(contentImages.length, 4)] ?? "";

  const tags = post.categories.filter(
    (c) => c === "full_remote" || c === "ja_required",
  );

  return (
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
          <p>{post.description || extractPreview(post.content)}</p>
        </CardContent>
        <CardContent className="px-4">
          {contentImages.length > 0 && (
            <div
              className={`aspect-video w-full overflow-hidden rounded-md ${gridClass}`}
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
  );
}
