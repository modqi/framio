import type { Metadata } from "next";
import "./globals.css";
import BfcacheRefresh from "./components/BfcacheRefresh";
import { CurrencyProvider } from "../lib/currency-context";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body><BfcacheRefresh /><CurrencyProvider>{children}</CurrencyProvider></body>
    </html>
  );
}