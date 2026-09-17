import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "แจ้งซ่อม มช.", template: "%s · แจ้งซ่อม มช." },
  description: "ระบบแจ้งซ่อมอาคารและอุปกรณ์ มหาวิทยาลัยเชียงใหม่",
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={plex.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
