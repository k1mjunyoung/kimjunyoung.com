import type { Post } from "@/lib/posts";
import PostCard from "./PostCard";
import { Separator } from "./ui/separator";

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p>No posts found.</p>;
  }
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </>
  );
}
