import type { Metadata } from "next";
import "@/components/admin/admin.css";

export const metadata: Metadata = { title: "Admin panel", robots: { index: false } };

// Dark mode FOUC qarşısı — render-dən əvvəl sinif tətbiq olunur (köhnə main.tsx davranışı).
const themeInit =
  "try{if(localStorage.getItem('gardrop_theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      {children}
    </>
  );
}
