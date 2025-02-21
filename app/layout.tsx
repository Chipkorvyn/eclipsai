import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* 
          Using Next.js <Script> with strategy="beforeInteractive" 
          so it's loaded early, preventing the 'no-sync-scripts' lint error.
        */}
      </head>
      <body>{children}</body>
    </html>
  );
}
