import type { MetadataRoute } from "next";

/** Lets phones add FastFix CMU to the home screen with its own name and icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FastFix CMU",
    short_name: "FastFix CMU",
    description: "ระบบแจ้งซ่อมอาคารและอุปกรณ์ มหาวิทยาลัยเชียงใหม่",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F5F7",
    theme_color: "#5B2C83",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
