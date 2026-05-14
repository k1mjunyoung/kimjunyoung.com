import { getAllPosts } from '@/lib/posts';
import Header from '@/components/Header';
import PostList from '@/components/PostList';
import JsonLd from '@/components/JsonLd';
import { websiteSchema } from '@/lib/seo';

export default function IndexPage() {
  const posts = getAllPosts('ko');
  return (
    <>
      <JsonLd schema={websiteSchema()} />
      <Header />
      <main
        style={{
          minHeight: 'calc(100vh - 80px - 200px)',
          backgroundColor: 'var(--color-background)',
          paddingTop: '30px',
          paddingBottom: '30px',
        }}
      >
        <div
          style={{
            width: 'var(--container-prose)',
            maxWidth: '90%',
            margin: '0 auto',
          }}
        >
          <PostList posts={posts} />
        </div>
      </main>
    </>
  );
}
