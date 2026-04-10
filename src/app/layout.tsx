import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Markd at Work — Factory Management",
  description: "Internal backend management for Aditya Gupta garment manufacturing",
  icons: {
    icon: "/logo-round-black.png",
    apple: "/logo-round-black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900">{
        <Providers>{children}</Providers>
      }</body>
    </html>
  );
}
