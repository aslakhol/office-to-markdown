import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office to Markdown",
  description: "Prototype foundation for office file to markdown conversion"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
