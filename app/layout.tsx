import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GjirafaNews - Lajmet më të reja shqip",
  description:
    "Platforma juaj për lajmet më të reja në gjuhën shqipe. Politikë, sport, teknologji, kulturë dhe më shumë.",
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
        <Navbar />
        <main className="flex-1 pb-20 sm:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
