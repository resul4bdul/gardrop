'use client';

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Xəta baş verdi:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-black mb-4">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Gözlənilməz xəta baş verdi</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Səhifə yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin və ya ana səhifəyə qayıdın.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="bg-black text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Yenidən cəhd et
        </button>
        <Link
          href="/"
          className="border border-slate-200 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ana səhifə
        </Link>
      </div>
    </div>
  );
}
