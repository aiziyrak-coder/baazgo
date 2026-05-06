import { PageScaffold } from "../components/PageScaffold.tsx";

export function LegalTermsPage() {
  return (
    <PageScaffold title="Foydalanish shartlari">
      <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <strong>Eslatma:</strong> Quyidagi matn loyiha uchun <strong>namuna</strong>{" "}
        hisoblanadi. Ishga tushirishdan oldin O‘zbekiston qonunchiligiga mos holda
        yurist tekshiruvidan o‘tkazish kerak.
      </p>
      <article className="space-y-4 text-sm leading-relaxed text-slate-800">
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">1. Umumiy qoidalar</h2>
          <p>
            BaazGo platformasi orqali foydalanish bilan siz ushbu shartlarga rozilik
            bildirasiz. Platforma furgon va mobil savdo uskunalarini ijaraga berish
            bo‘yicha e’lonlar va bronlarni qulaylashtirish uchun mo‘ljallangan.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">2. Hisob va xavfsizlik</h2>
          <p>
            Ro‘yxatdan o‘tishda berilgan ma’lumotlarning to‘g‘riligi uchun
            foydalanuvchi javobgardir. Kirish ma’lumotlarini uchinchi shaxslarga
            bermaslik kerak.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">3. Bron va to‘lov</h2>
          <p>
            Bron tasdiqlangach, shartnomaviy munosabatlar ijrochilar (mijoz va egasi)
            o‘rtasida tuziladi. To‘lov va depozit qoidalari har bir e’lon uchun alohida
            ko‘rsatilishi lozim. Platforma integratsiya qilingan to‘lov provayderlari
            orqali tranzaksiyalarni amalga oshirishi mumkin.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">4. Mas’uliyat chegarasi</h2>
          <p>
            Platforma texnik vositachi sifatida e’lon mazmuniga to‘liq javob bermaydi.
            Nizo holatlarida foydalanuvchilar o‘zaro yoki huquqiy organlar orqali hal
            etishlari mumkin.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">5. O‘zgarishlar</h2>
          <p>
            Shartlar yangilanishi mumkin. Muhim o‘zgarishlar ilovada yoki elektron
            pochta orqali xabar qilinishi tavsiya etiladi.
          </p>
        </section>
      </article>
    </PageScaffold>
  );
}
