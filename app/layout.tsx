import type { Metadata } from "next";
import "./globals.css";
import BfcacheRefresh from "./components/BfcacheRefresh";
import { CurrencyProvider } from "../lib/currency-context";
import { LocaleProvider } from "../lib/locale-context";

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C8622A" />
        <meta name="google-site-verification" content="L0defMQayaQNMiBzaBuaiy2bBqkpzIYenDjusZTfglg" />
      </head>
      <body><BfcacheRefresh /><CurrencyProvider><LocaleProvider>{children}</LocaleProvider></CurrencyProvider></body>
    </html>
  );
}