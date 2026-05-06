import { Link } from "react-router-dom";
import { PageScaffold } from "../components/PageScaffold.tsx";

export function NotFoundPage() {
  return (
    <PageScaffold title="Sahifa topilmadi">
      <p className="mb-6 text-sm text-slate-700">
        Manzil noto‘g‘ri yoki sahifa olib tashlangan. Bosh sahifaga qayting.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-2xl bg-[#0f172a] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Xaritaga o‘tish
      </Link>
    </PageScaffold>
  );
}
