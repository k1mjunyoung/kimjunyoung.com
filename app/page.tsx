import { getAllPosts } from "@/lib/posts";
import Header from "@/components/Header";
import PostList from "@/components/PostList";
import JsonLd from "@/components/JsonLd";
import { websiteSchema } from "@/lib/seo";

export default async function IndexPage() {
  const posts = await getAllPosts();
  return (
    <>
      <JsonLd schema={websiteSchema()} />
      <Header />
      <main className="bg-background min-h-[calc(100vh-280px)] md:mx-auto md:max-w-3xl md:border-s md:border-e">
        <PostList posts={posts} />
      </main>
    </>
  );
}
