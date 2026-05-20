import type { Metadata } from "next";
import "./globals.css";
import { GlobalProvider } from "@/context/GlobalContext";

export const metadata: Metadata = {
  title: "Sede Electrónica",
  description: "Sistema de sede electrónica para la administración pública",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
