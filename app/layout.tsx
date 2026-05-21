import type { Metadata } from "next";
import "@/styles/globals.css";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import Providers from "@/components/Providers";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="ko" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />
      </head>
      <body>
        <Providers>
          <Analytics />
          <Menu />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
