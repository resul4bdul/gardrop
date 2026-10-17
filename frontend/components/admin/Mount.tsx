'use client';
import dynamic from 'next/dynamic';

// Panel yalnız brauzerdə render olunur (login arxasında, SEO ehtiyacı yox) —
// köhnə SPA davranışı və dizayn 1:1 qalır.
const App = dynamic(() => import('./AdminApp'), { ssr: false });

export default function Mount() { return <App />; }
