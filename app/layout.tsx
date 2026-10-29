import type { Metadata } from "next";
import { Dela_Gothic_One, Geist, Geist_Mono } from "next/font/google";
import Music from "@/components/Music";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${delaGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Music />
      </body>
    </html>
  );
}
