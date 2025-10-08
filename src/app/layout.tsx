import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sora 2 Explorer",
  description:
    "Generate stunning videos with AI using Sora 2 and Sora 2 Pro. Pay with crypto or Echo credits.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Sora 2 Explorer",
    description:
      "Generate stunning videos with AI using Sora 2 and Sora 2 Pro. Pay with crypto or Echo credits.",
    images: [
      {
        url: "/logo/sora.png",
        width: 1200,
        height: 630,
        alt: "Sora 2 Explorer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sora 2 Explorer",
    description:
      "Generate stunning videos with AI using Sora 2 and Sora 2 Pro. Pay with crypto or Echo credits.",
    images: ["/logo/sora.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
