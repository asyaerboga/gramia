@AGENTS.md

# Gramia — Kod Kalite Kuralları

Bu proje Next.js 16 App Router + Mongoose + NextAuth üzerine kurulu bir diyetisyen-danışan platformudur. Aşağıdaki kurallar projede tespit edilen somut sorunlara karşı gelir; teorik değil zorunludur.

---

## 1. API Route Şablonu — Her Route Aynı Olmalı

Her route'da tekrar eden auth + dbConnect bloğu:

```ts
// YASAK — her dosyada bu tekrar ediyor
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
await dbConnect();
```

**Kural:** Yeni bir route yazarken `src/lib/apiHelpers.ts` içinde yardımcı fonksiyon yoksa önce onu oluştur. Örnek şablon:

```ts
// src/lib/apiHelpers.ts
export async function requireSession(role?: "client" | "dietitian") { ... }
export async function withDb() { return dbConnect(); }
```

Var olan route'lara dokunmadan yeni route eklenecekse bu şablonu kullan.

---

## 2. God Component Yasak — `[clientId]/page.tsx` Örneği

`src/app/dashboard/dietitian/clients/[clientId]/page.tsx` **1327 satır**, **20+ useState**, **5 tab**, **3 modal** içeriyor. Bu tek dosyanın sorumluluğu aşmış olduğuna dair referans noktasıdır.

**Kural:** Bir sayfa bileşeni 300 satırı geçerse sekmeleri/modalleri ayrı bileşene taşı.

Beklenen yapı:
```
src/components/dietitian/client-detail/
  OverviewTab.tsx
  ExercisesTab.tsx
  WellnessTab.tsx
  MealsTab.tsx
  AchievementsTab.tsx
  MeasurementModal.tsx
  WeightModal.tsx
  HealthModal.tsx
```

Sayfa dosyası sadece tab yönlendirmesi ve üst profil header'ı içermeli.

---

## 3. Inline Sabitler Map İçinde Yasak

```tsx
// YASAK — her render'da yeniden oluşturuluyor
{satietyRecords.map((s) => {
  const emojis = ["😫","😕","😊","😄","🤩"];
  const labels = ["Çok Aç","Aç","Normal","Tok","Çok Tok"];
  ...
})}
```

**Kural:** Sabitler dosyanın üst kapsamında `const` olarak tanımlanır, asla map/render içinde.

---

## 4. Hardcoded Değer Yasak

```ts
// YASAK — src/app/api/dietitian/clients/[clientId]/route.ts:62
targetCalories: 1800,
```

**Kural:** Magic number'lar `src/lib/constants.ts` içine taşınır:
```ts
export const DEFAULT_TARGET_CALORIES = 1800;
```

---

## 5. Dil Tutarlılığı — Hata Mesajları

API'lerin bir kısmı Türkçe, bir kısmı İngilizce hata döndürüyor. Bu karışıklık frontend'de gösterim tutarsızlığı yaratır.

**Kural:** Tüm API response hataları Türkçe olacak.
- `"Unauthorized"` → `"Yetkisiz"`
- `"Internal server error"` → `"Sunucu hatası"`
- `"Client not found"` → `"Danışan bulunamadı"`

---

## 6. `any` Tipi Yasak

```ts
// YASAK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serialized = messages.map((m: any) => ({ ... }));
```

**Kural:** `any` kullanımı yasaktır. Mongoose lean() dönüşleri için tip tanımla:
```ts
import type { InferSchemaType } from "mongoose";
```
veya satır içi interface yaz.

---

## 7. `<img>` Yerine Next.js `<Image>` Kullan

Kod tabanında birden fazla:
```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={...} alt={...} />
```

**Kural:** Bilinmeyen boyuttaki harici URL'ler (avatar, kan tahlili görseli) için `<Image unoptimized>` kullan. ESLint'i disable etme.

---

## 8. Polling ve Socket Çakışması

`[clientId]/page.tsx` 30 saniyelik `setInterval` polling kullanıyor, aynı zamanda `socket.io` bağlantısı da var.

**Kural:** Gerçek zamanlı güncelleme için sadece socket kullan. Polling `setInterval` kaldırılmalı; socket event'i yoksa `SWR` veya `React Query` ile cache-revalidation yap. İki mekanizma birden olmayacak.

---

## 9. Interface'ler Sayfa Dosyasında Değil

`[clientId]/page.tsx` içinde 15+ interface tanımı var (`ClientProfile`, `BloodTestRecord`, `SatietyRecord`, ...). Bunlar bileşenle birlikte büyüyor.

**Kural:** Paylaşılan tipler `src/types/` altına taşınır:
```
src/types/
  client.ts      — ClientProfile, MeasurementRecord, ...
  messages.ts    — Message, Conversation, ...
  diet.ts        — DietPlan, Meal, ...
```

Sadece o dosyaya özgü küçük tipler (örn. bir form state'i) inline kalabilir.

---

## 10. Her API Route try/catch Kullanmalı

```ts
// YASAK — conversations/route.ts GET handler try/catch yok
export async function GET() {
  const session = await getServerSession(authOptions);
  ...
  const conversations = await Conversation.find(...);
  return NextResponse.json(conversations);
}
```

**Kural:** Tüm route handler'lar `try/catch` içermeli, catch'te `status: 500` döndürmeli.

---

## 11. Bileşen Granülaritesi

`StatCard` ve `EmptyState` gibi küçük yardımcı bileşenler sayfa dosyasında tanımlanmış.

**Kural:** Birden fazla yerde kullanılacak veya kullanılabilecek bileşenler `src/components/shared/` altına taşınır. Sayfa-özel tek kullanımlık ufak bileşenler aynı dosyada kalabilir ama 50 satırı geçmemeli.

---

## Genel Prensipler

- Bir dosya 300 satırı geçince bölünür.
- Aynı kod bloğu 2 farklı dosyada görünüyorsa ortak yardımcıya taşınır.
- `console.error` üretimde çıktı verir; sadece hata sınırlarında bırak, loglama sistemi yoksa kaldır.
- Yorum satırı sadece "neden" açıklar, "ne yaptığını" değil.
