import { PageScaffold } from "../components/PageScaffold.tsx";
import { CheckCircle2, Circle } from "lucide-react";

const phases: { title: string; done: boolean; items: string[] }[] = [
  {
    title: "Bosqich 1 — Texnik zamin",
    done: true,
    items: [
      "API: /api/health, /api/v1/meta, trucks, bookings",
      "Serverda bron uchun vaqt oralig‘i to‘qnashuvi tekshiruvi",
      "Mobil xarita layout va Leaflet invalidateSize",
      "PWA manifest (Add to Home Screen)",
    ],
  },
  {
    title: "Bosqich 2 — Mahsulot vertikali",
    done: false,
    items: [
      "Haqiqiy ma’lumot bazasi (Firestore / PostgreSQL)",
      "To‘lov: Payme / Click webhook va statuslar",
      "Ega kabineti: listing + kalendar",
      "Push / SMS xabarnomalar",
    ],
  },
  {
    title: "Bosqich 3 — Ishonch va masshtab",
    done: false,
    items: [
      "Yuridik shartlar va maxfiylik (ekspertiza bilan)",
      "KYC / verifikatsiya",
      "Admin: nizo, moderatsiya, hisobotlar",
      "Sentry, loglar, SLA monitoring",
    ],
  },
];

export function PlatformRoadmapPage() {
  return (
    <PageScaffold title="Platforma rejasi">
      <p className="mb-6 text-sm leading-relaxed text-slate-700">
        Quyida kuchli marketplace uchun yo‘l xaritasi. Bajarilgan qismlar server va
        klient kodida bosqichma-bosqich qo‘shiladi.
      </p>
      <div className="space-y-6">
        {phases.map((phase) => (
          <section
            key={phase.title}
            className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
              {phase.done ? (
                <CheckCircle2 className="h-5 w-5 text-[#34C759]" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              {phase.title}
            </h2>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageScaffold>
  );
}
