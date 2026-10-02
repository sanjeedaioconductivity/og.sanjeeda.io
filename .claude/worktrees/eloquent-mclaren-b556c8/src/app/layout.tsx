import type { Metadata } from "next";
import "./globals.css";
import "../App.css";
import { jameelNoori } from "./fonts";
import ResponsiveNav from "./components/nav/ResponsiveNav";
import Footer from "./footer/Footer";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider, THEME_STORAGE_KEY } from "@/components/theme-provider";

// Applied before paint to avoid a flash of the wrong theme. Must stay in sync
// with ThemeProvider (same storage key, same resolution of 'system').
const themeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);var d=t==='dark'||((t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Sanjeeda.io",
  description: "Sanjeeda website",
  icons: {
    icon: "/sanjeeda-logo.png",
    shortcut: "/sanjeeda-logo.png",
    apple: "/sanjeeda-logo.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};
import { Analytics } from "@vercel/analytics/next"
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <html lang="en" className="h-full w-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${jameelNoori.variable} antialiased min-h-screen w-full overflow-x-hidden`}>
        <ThemeProvider>
          <ResponsiveNav/>
            <SpeedInsights />
              {children}
          <Analytics />
          <Footer/>
          <Toaster/>
        </ThemeProvider>
      </body>
    </html>
  );
}