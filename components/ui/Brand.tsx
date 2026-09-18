import Image from "next/image";
import { cn } from "@/lib/cn";

export const APP_NAME = "FastFix CMU";

/** App icon (rounded purple square with the F, wrench and pin). Decorative: the name is always written next to it. */
export function BrandIcon({ size = 40, className }: { size?: number; className?: string }) {
  return <Image src="/brand/fastfix-icon.png" alt="" width={size} height={size} className={cn("shrink-0", className)} priority />;
}

/** Full "FastFix CMU" wordmark. `onBrand` is the white version for the purple panel. */
export function BrandWordmark({ height = 40, onBrand, className }: { height?: number; onBrand?: boolean; className?: string }) {
  // Source images are 900 × 174.
  const width = Math.round((height * 900) / 174);
  return (
    <Image
      src={onBrand ? "/brand/fastfix-wordmark-white.png" : "/brand/fastfix-wordmark.png"}
      alt={APP_NAME}
      width={width}
      height={height}
      className={cn("h-auto max-w-full", className)}
      priority
    />
  );
}
