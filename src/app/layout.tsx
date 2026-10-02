import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/dreamforge/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ImageGenarateAI — Turn Your Imagination Into Images",
  description:
    "Create stunning, detailed visuals from simple words with next-generation AI. Cinematic scenes, realistic portraits, fantasy worlds, and more — in seconds.",
  keywords: [
    "AI image generation",
    "AI art",
    "ImageGenarateAI",
    "text to image",
    "AI creative tool",
    "image generator",
  ],
  authors: [{ name: "ImageGenarateAI" }],
  openGraph: {
    title: "ImageGenarateAI — Turn Your Imagination Into Images",
    description:
      "Create stunning, detailed visuals from simple words with next-generation AI.",
    siteName: "ImageGenarateAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImageGenarateAI — Turn Your Imagination Into Images",
    description:
      "Create stunning, detailed visuals from simple words with next-generation AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
