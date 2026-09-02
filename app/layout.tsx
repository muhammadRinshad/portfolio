import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muhammed Rinshad — MERN Stack Developer",
  description:
    "MERN Stack Developer specializing in React, Next.js, Node.js, and full-stack web applications. Based in Malappuram, Kerala.",
  openGraph: {
    title: "Muhammed Rinshad — MERN Stack Developer",
    description:
      "MERN Stack Developer specializing in React, Next.js, Node.js, and full-stack web applications. Based in Malappuram, Kerala.",
    url: "https://muhammed-rinshad.vercel.app",
    siteName: "Muhammed Rinshad Portfolio",
    images: [
      {
        url: "/me%20cartoon%203.webp",
        width: 1200,
        height: 630,
        alt: "Muhammed Rinshad — MERN Stack Developer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammed Rinshad — MERN Stack Developer",
    description:
      "MERN Stack Developer specializing in React, Next.js, Node.js, and full-stack web applications.",
    images: ["/me%20cartoon%203.webp"],
  },
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
