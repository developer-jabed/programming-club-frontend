import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import LogoutSuccessToast from "@/components/shared/LogoutSuccessToast";
import LoginSuccessToast from "@/components/shared/LoginSuccessToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DPI Programming Club",
    template: "%s · DPI Programming Club",
  },
  description:
    "DPI Programming Club — projects, tasks, tests, sectors, and community for builders.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${syne.variable}
          ${dmSans.variable}
          min-h-screen
          bg-background
          text-foreground
          font-sans
          antialiased
          selection:bg-primary/30
          selection:text-foreground
        `}
      >
        {children}

        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            classNames: {
              toast:
                "border border-border bg-card text-foreground shadow-lg",
              title: "text-foreground font-medium",
              description: "text-muted-foreground",
              success: "border-primary/30",
              error: "border-destructive/40",
            },
          }}
        />

        <LoginSuccessToast />
        <LogoutSuccessToast />
      </body>
    </html>
  );
}