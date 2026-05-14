import Link from "next/link";
import type { Post } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";

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
    <div className="mx-auto w-[var(--container-prose)]">
      <Link href={`/post/${post.slug}`}>
        <Card className="rounded-none border-b shadow-none ring-0">
          {post.thumbnail_url && (
            <div>
              <img src={post.thumbnail_url} alt={post.title} />
            </div>
          )}
          <CardContent>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>
              <p>{post.description || ""}</p>
              <small>
                업데이트 <time dateTime={post.date}>{dateStr}</time>
              </small>
            </CardDescription>
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
