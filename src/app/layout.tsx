import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteShell } from "../components/site-shell";

const headingSerif = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const bodySans = Inter({
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
        <Toaster />
      </body>
    </html>
  );
}
