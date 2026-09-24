import "./globals.css";
import React from "react";
import { TYPOGRAPHY } from "@avclub/config";
import { ScanlineOverlay } from "@avclub/ui";

export const metadata = {
  title: "AVCLUB // Build Cool AV Together",
  description: "Community engagement platform for building and developing AV projects through membership and regular events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={TYPOGRAPHY.GOOGLE_FONTS_URL} rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-obsidian text-white antialiased flex flex-col justify-between">
        <ScanlineOverlay opacity={0.04} />
        {children}
      </body>
    </html>
  );
}
