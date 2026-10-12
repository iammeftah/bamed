import type { Metadata } from "next";
import { Barlow_Condensed, Manrope, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/landing/motion-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="motion-safe:scroll-smooth"
    >
      <body
        className={`${manrope.variable} ${geistMono.variable} ${barlow.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <MotionProvider>
            <AuthProvider>
              <SiteHeader />
              {children}
              <SiteFooter />
            </AuthProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}