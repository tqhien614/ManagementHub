import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-PDMH",
  description: "AI Product Document Management Hub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
