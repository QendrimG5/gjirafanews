import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import StoreProvider from "@/components/providers";
import ThemeProvider from "@/components/theme-provider";
import GoogleAnalytics from "@/components/google-analytics";

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
    description: "Platforma juaj për lajmet më të reja në gjuhën shqipe.",
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
      suppressHydrationWarning
    >
      <head>
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        /> */}
      </head>
      <body className="text-foreground flex min-h-full flex-col">
        <GoogleAnalytics />
        <ThemeProvider>
          <StoreProvider>
            <Navbar />
            <main className="flex-1 pb-20 sm:pb-0">{children}</main>
            <BottomNav />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
