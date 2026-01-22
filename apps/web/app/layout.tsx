import type { Metadata } from "next";
import "./globals.css";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "UZEED",
  description: "UZEED",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black text-white">
        <div className="flex">
          <Nav />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-8 md:py-10 pb-24 md:pb-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
