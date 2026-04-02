import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import StoreProvider from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GjirafaNews - Lajmet më të reja shqip",
    template: "%s | GjirafaNews",
  },
  description:
    "Platforma juaj për lajmet më të reja në gjuhën shqipe. Politikë, sport, teknologji, kulturë dhe më shumë.",
  keywords: [
    "lajme",
    "shqip",
    "kosovë",
    "shqipëri",
    "politikë",
    "sport",
    "teknologji",
    "kulturë",
    "GjirafaNews",
  ],
  authors: [{ name: "GjirafaNews" }],
  openGraph: {
    type: "website",
    locale: "sq_AL",
    siteName: "GjirafaNews",
    title: "GjirafaNews - Lajmet më të reja shqip",
    description:
      "Platforma juaj për lajmet më të reja në gjuhën shqipe. Politikë, sport, teknologji, kulturë dhe më shumë.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GjirafaNews - Lajmet më të reja shqip",
    description:
      "Platforma juaj për lajmet më të reja në gjuhën shqipe.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 pb-20 sm:pb-0">{children}</main>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
