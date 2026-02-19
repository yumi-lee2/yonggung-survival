import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "용궁에서 살아남기",
  description: "별주부전을 모티브로 한 러너 게임. 용왕의 심복들을 피해 수면까지 도망치세요!",
  keywords: ["러너", "별주부전", "용궁", "게임", "아케이드"],
  openGraph: {
    title: "용궁에서 살아남기",
    description: "용왕의 심복들을 피해 수면까지 도망치세요!",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} antialiased`} style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
