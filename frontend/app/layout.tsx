import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers/providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "OCI - EduTech",
  description: "Modern EdTech platform for notes, model question papers, mock tests, and projects.",
  icons: {
    icon: [{ url: "/oci-edutech.png", type: "image/png" }],
    shortcut: ["/oci-edutech.png"],
    apple: ["/oci-edutech.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
