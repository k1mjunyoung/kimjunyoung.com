import type { Metadata } from "next";
import "@/styles/globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Analytics from "@/components/Analytics";
import Providers from "@/components/Providers";
import { JetBrains_Mono } from "next/font/google";

// 메타 정보(날짜, 태그, 로고)와 코드용
const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: process.env.NEXT_PUBLIC_SITE_TITLE,
  description: process.env.NEXT_PUBLIC_SEO_DESC,
  other: {
    "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT!,
  },
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON,
    apple: process.env.NEXT_PUBLIC_FAVICON,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    images: [{ url: process.env.NEXT_PUBLIC_OG_IMAGE! }],
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={mono.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />
      </head>
      <body>
        <Providers>
          <Analytics />
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
