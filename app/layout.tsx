import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio | Creative Developer & Designer",
  description: "A minimal, illustration-based portfolio showcasing creative work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-charcoal-dark text-ivory selection:bg-gray-cool selection:text-ivory">
        {children}
      </body>
    </html>
  );
}
