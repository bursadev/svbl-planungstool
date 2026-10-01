import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthTokenBridge } from "@/components/auth-token-bridge";
import { UserbackWidget } from "@/components/userback-widget";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SVBL Planung", template: "%s · SVBL Planung" },
  description: "Kursplanungstool der ASFL SVBL",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="de" className={`${plexSans.variable} ${plexMono.variable}`}>
        <body>
          <TooltipProvider>
            <AuthTokenBridge />
            {children}
            <Toaster position="bottom-center" theme="light" />
            <UserbackWidget />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
