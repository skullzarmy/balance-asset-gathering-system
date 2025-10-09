import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import ServiceWorkerManager from "@/components/service-worker-manager";
import CacheManager from "@/components/cache-manager";
import { QueryProvider } from "@/components/query-provider";

export const metadata = {
    title: "B.A.G.S. - Balance & Asset Gathering System",
    description: "Track your Tezos and Etherlink wallets",
    applicationName: "B.A.G.S.",
    appleWebApp: {
        title: "B.A.G.S.",
        capable: true,
        statusBarStyle: "default",
    },
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "apple-mobile-web-app-title": "B.A.G.S.",
        "msapplication-TileColor": "#ffffff",
        "msapplication-tap-highlight": "no",
        "format-detection": "telephone=no",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            </head>
            <body>
                <QueryProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <CacheManager />
                        {children}
                        <PWAInstallPrompt />
                        <ServiceWorkerManager />
                        <Toaster richColors />
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
