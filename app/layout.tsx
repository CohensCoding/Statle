import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statle",
  description: "Daily NBA stat-line guessing game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[--bg] text-[--fg] flex justify-center">
        <div className="w-full max-w-[440px] min-h-screen relative">{children}</div>
      </body>
    </html>
  );
}
