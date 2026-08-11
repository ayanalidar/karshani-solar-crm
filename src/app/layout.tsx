import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karshani Solar CRM",
  description: "Solar equipment management — inventory, billing, quotations, invoices, CRM",
  applicationName: "Karshani Solar CRM",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Karshani CRM",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/logo.jpeg", sizes: "192x192", type: "image/jpeg" },
      { url: "/logo.jpeg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [{ url: "/logo.jpeg", sizes: "192x192", type: "image/jpeg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Register the service worker on the client (must be a separate component
// because metadata files are server components).
function ServiceWorkerRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.debug('[sw] registered', reg.scope))
                .catch((err) => console.warn('[sw] registration failed', err));
            });
          }
        `,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
