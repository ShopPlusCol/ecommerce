import type { Metadata } from "next";
import { fraunces, manrope } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { getBrandSettings } from "@/modules/settings/brand";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: `${brand.name} — ${brand.tagline}`, template: `%s | ${brand.name}` },
    description: brand.description,
    icons: { icon: brand.faviconUrl ?? undefined, apple: brand.appleTouchIconUrl ?? undefined },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      siteName: brand.name,
      images: brand.openGraphImageUrl ? [brand.openGraphImageUrl] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface text-text">
        {children}
      </body>
    </html>
  );
}
