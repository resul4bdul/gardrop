// Dark mode: render-dən əvvəl tətbiq et (FOUC olmasın).
try { if (localStorage.getItem("gardrop_theme") === "dark") document.documentElement.classList.add("dark"); } catch { /* ignore */ }
import "./admin.css";
import "./AdminApp"; // port app özünü createRoot ilə mount edir
