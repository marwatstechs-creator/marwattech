import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { Providers } from "@/app/providers";
import { Analytics } from "@/components/analytics/scripts";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { SiteVerification } from "@/components/seo/site-verification";
import { CustomHeadCode } from "@/components/seo/custom-head-code";
import { AdSenseHead } from "@/components/adsense/adsense-head";
import { GoogleOneTapGlobal } from "@/components/admin/google-one-tap-global";
import { SITE } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Web Development, Ecommerce, SEO & AI Solutions`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "web development",
    "next.js development",
    "wordpress design",
    "ecommerce website",
    "mobile app development",
    "ui ux design",
    "seo services",
    "ai solutions",
    "Marwat Tech",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} | Web Development, Ecommerce, SEO & AI Solutions`,
    description: SITE.description,
    images: [{ url: `${SITE.url}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Web Development, Ecommerce, SEO & AI Solutions`,
    description: SITE.description,
    images: [`${SITE.url}/og-default.png`],
  },
  icons: {
    icon: "/assets/logo-dark-square.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7464c6" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Polyfill for the esbuild/SWC `__name` helper that OpenNext's
            minified inline scripts reference but don't define. Prevents the
            "ReferenceError: __name is not defined" console error that broke
            the next-themes pre-hydration script on every page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__name=function(t,n){try{Object.defineProperty(t,"name",{value:n,configurable:true})}catch(e){}};`,
          }}
        />
        <SiteVerification />
        <CustomHeadCode />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <SiteVerification />
        <AdSenseHead />
        <Providers>
          {children}
          <Analytics />
        </Providers>
        <PwaRegister />
        <PwaInstallPrompt />
        <CookieConsent />
        <GoogleOneTapGlobal />
      </body>
    </html>
  );
}
