import type { Metadata } from 'next';
import '@/styles/globals.css';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: process.env.NEXT_PUBLIC_SITE_TITLE,
  description: process.env.NEXT_PUBLIC_SEO_DESC,
  other: {
    'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT!,
  },
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON,
    apple: process.env.NEXT_PUBLIC_FAVICON,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: process.env.NEXT_PUBLIC_OG_IMAGE! }],
  },
  twitter: { card: 'summary' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={cn("font-sans", inter.variable)}>
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
