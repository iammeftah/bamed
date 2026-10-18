import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/landing/motion-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { productsService } from "@/services/products.service";
import "./globals.css";
import { SelectionBar } from "@/components/shop/selection-bar";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAMED | Mode homme premium",
  description:
    "BAMED : la mode homme premium du quotidien, des coupes nettes pensées pour bouger avec vous.",
};

/** Categories that have products, for the footer links (one small request). */
async function getFooterCategories(): Promise<{ id: string; label: string }[]> {
  try {
    const categories = await productsService.getCategories();
    return categories
      .filter((c) => (c.productCount ?? 0) > 0)
      .map((c) => ({ id: c.id, label: c.label }));
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const footerCategories = await getFooterCategories();

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="motion-safe:scroll-smooth"
    >
      <body
        className={`${manrope.variable} ${barlow.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <MotionProvider>
            <AuthProvider>
              <SiteHeader />
              {children}
              <SiteFooter categories={footerCategories} />
              <SelectionBar />
            </AuthProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}