import type { Metadata } from "next";
import { Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { SiteShell } from "../components/site-shell";

const headingSerif = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const bodySans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Canvus | Meru's Premier B2B & Wholesale Shop",
  description:
    "Canvus is Meru's premier B2B and wholesale platform for schools, institutions, and businesses. Bulk pricing, wholesale ordering via WhatsApp, M-Pesa payments, and fast delivery.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingSerif.variable} ${bodySans.variable} antialiased`}
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
