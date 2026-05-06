import { PageScaffold } from "../components/PageScaffold.tsx";

export function LegalPrivacyPage() {
  return (
    <PageScaffold title="Maxfiylik siyosati">
      <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <strong>Eslatma:</strong> Quyidagi matn <strong>namuna</strong>. Yakuniy
        siyosat GDPR/O‘zbekiston shaxsiy ma’lumotlar to‘g‘risidagi talablarga mos
        kelishi uchun huquqiy ekspertiza talab qilinadi.
      </p>
      <article className="space-y-4 text-sm leading-relaxed text-slate-800">
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">1. Qanday ma’lumotlar</h2>
          <p>
            Telefon, ism, elektron pochta, bron tarixi, qurilma va brauzer haqida
            texnik ma’lumotlar (xavfsizlik va analitika uchun) yig‘ilishi mumkin.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">2. Maqsad</h2>
          <p>
            Xizmat ko‘rsatish, autentifikatsiya, mijoz qo‘llab-quvvatlash, firibgarlikning
            oldini olish va platformani yaxshilash.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">3. Saqlash muddati</h2>
          <p>
            Ma’lumotlar huquqiy va operatsion talablar doirasida, odatda hisob
            faol bo‘lgan davrda va undan keyin belgilangan muddat davomida saqlanadi.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">4. Uchinchi tomonlar</h2>
          <p>
            Hosting, xarita va to‘lov provayderlari bilan ma’lumot almashinuvi ularning
            shartlariga muvofiq amalga oshirilishi mumkin.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">5. Huquqlar</h2>
          <p>
            Foydalanuvchi o‘z ma’lumotlariga kirish, tuzatish yoki o‘chirishni so‘rash
            huquqiga ega (qonun doirasida).
          </p>
        </section>
      </article>
    </PageScaffold>
  );
}
