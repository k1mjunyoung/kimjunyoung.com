import type { Metadata } from 'next';
import type { Post } from './posts';
import { SITE_TITLE, SITE_URL, SEO_DESC, OG_IMAGE } from '@/i18n/translations';

export function buildMetadata(post: Post): Metadata {
  const canonical = `/post/${post.slug}`;
  const image = post.firstImage ?? OG_IMAGE;

  return {
    metadataBase: new URL(SITE_URL),
    title: `${post.title} - ${SITE_TITLE}`,
    description: post.description || SEO_DESC,
    alternates: {
      canonical,
      languages: { 'x-default': '/' },
    },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: `${SITE_URL}${canonical}`,
      title: `${post.title} - ${SITE_TITLE}`,
      description: post.description || SEO_DESC,
      publishedTime: post.date,
      images: [{ url: image.startsWith('http') ? image : `${SITE_URL}${image}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} - ${SITE_TITLE}`,
      description: post.description || SEO_DESC,
    },
  };
}

export function articleSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || SEO_DESC,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: 'Kim Junyoung',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'kimjunyoung.com',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/logo.png` },
    },
    url: `${SITE_URL}/post/${post.slug}`,
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_TITLE,
    url: SITE_URL,
    description: SEO_DESC,
    author: {
      '@type': 'Person',
      name: 'Kim Junyoung',
      jobTitle: 'Backend Engineer',
    },
  };
}
