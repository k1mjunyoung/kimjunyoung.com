import type { Metadata } from 'next';
import '@/styles/globals.css';
import { SITE_TITLE, SEO_DESC, SITE_URL, OG_IMAGE, FAVICON, ADSENSE_CLIENT } from '@/i18n/translations';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SEO_DESC,
  other: {
    'google-adsense-account': ADSENSE_CLIENT,
  },
  icons: {
    icon: FAVICON,
    apple: FAVICON,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: OG_IMAGE }],
  },
  twitter: { card: 'summary' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body>
        <Analytics />
        <Menu />
        {children}
        <Footer />
      </body>
    </html>
  );
}
