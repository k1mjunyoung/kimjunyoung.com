import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { SITE_URL } from '@/i18n/translations';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts('ko');

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/post/${post.slug}`,
    lastModified: post.date || new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...postEntries,
  ];
}
