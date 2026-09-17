"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PhotoGallery({ urls, label }: { urls: string[]; label: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const close = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % urls.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, urls.length, close]);

  if (!urls.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setIndex(i)}
            className="relative aspect-square overflow-hidden rounded-[12px] bg-fill"
            aria-label={`เปิด${label} รูปที่ ${i + 1} แบบเต็มจอ`}
          >
            <Image src={u} alt={`${label} ${i + 1}`} fill sizes="(max-width: 560px) 33vw, 180px" className="object-cover" />
          </button>
        ))}
      </div>
      {mounted
        ? createPortal(
            <AnimatePresence>
              {index !== null ? (
                <motion.div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${label} รูปที่ ${index + 1} จาก ${urls.length}`}
                  onClick={close}
                >
                  <motion.div
                    key={index}
                    className="relative h-[80dvh] w-full max-w-[960px]"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image src={urls[index]} alt={`${label} ${index + 1}`} fill sizes="100vw" className="object-contain" priority />
                  </motion.div>
                  <button type="button" onClick={close} className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white" aria-label="ปิด">
                    <X size={22} />
                  </button>
                  {urls.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIndex((index - 1 + urls.length) % urls.length);
                        }}
                        className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white"
                        aria-label="รูปก่อนหน้า"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIndex((index + 1) % urls.length);
                        }}
                        className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white"
                        aria-label="รูปถัดไป"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/80">
                        {index + 1} / {urls.length}
                      </p>
                    </>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
