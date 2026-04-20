import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lomissa",
  description: "Connect with photographers worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}