import { PageScaffold } from "../components/PageScaffold.tsx";
import { Calendar, MapPin, ShieldCheck, Truck } from "lucide-react";

export function OwnerHubPage() {
  return (
    <PageScaffold title="Furgon egasi">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-slate-700">
          Bu bo‘limda kelajakdagi <strong>ega kabineti</strong> joylashadi: o‘z
          furgonlaringiz, bronlar, narxlash va mavjudlik kalendari.
        </p>

        <ul className="space-y-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <li className="flex gap-3 text-sm text-slate-800">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#0f172a]" />
            <span>
              <strong className="text-slate-900">Listinglar</strong> — foto, tavsif,
              texnik parametrlar, ijaraga berish narxi.
            </span>
          </li>
          <li className="flex gap-3 text-sm text-slate-800">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#0f172a]" />
            <span>
              <strong className="text-slate-900">Kalendar</strong> — band va bo‘sh
              kunlar, avtomatik konflikt tekshiruvi.
            </span>
          </li>
          <li className="flex gap-3 text-sm text-slate-800">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0f172a]" />
            <span>
              <strong className="text-slate-900">Joylashuv</strong> — xaritada
              ko‘rsatish va yetkazib berish zonasi.
            </span>
          </li>
          <li className="flex gap-3 text-sm text-slate-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0f172a]" />
            <span>
              <strong className="text-slate-900">Ishonch</strong> — hujjatlar,
              verifikatsiya, reyting.
            </span>
          </li>
        </ul>

        <p className="text-xs text-slate-500">
          Hozircha bu sahifa yo‘l xaritasi sifatida ko‘rsatiladi. To‘liq CRUD va
          rollar keyingi bosqichda Firebase yoki PostgreSQL bilan bog‘lanadi.
        </p>
      </div>
    </PageScaffold>
  );
}
