import type { Metadata, Viewport } from "next";
import { SITE, SITE_URL } from "@/config/site";
import { brand, courier, fell, gowun, pretendard } from "./fonts";
import "./globals.css";

// 카카오톡·인스타 등 링크 미리보기: 시작 화면 첫 장 그림
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE.name,
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    images: [{ url: "/home/riso-blue.webp", width: 2560, height: 1371 }],
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${gowun.variable} ${courier.variable} ${fell.variable} ${brand.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
