import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 font-sans">
      <div className="text-6xl font-black text-brand">404</div>
      <p className="text-t2">Axtardığınız səhifə tapılmadı.</p>
      <Link href="/" className="bg-brand text-white px-6 py-3 rounded-btn font-semibold">Ana səhifəyə qayıt</Link>
    </div>
  );
}
