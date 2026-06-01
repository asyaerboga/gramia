export interface TurkishHoliday {
  date: string; // MM-DD
  name: string;
}

export const TURKISH_FIXED_HOLIDAYS: TurkishHoliday[] = [
  { date: "01-01", name: "Yılbaşı" },
  { date: "04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { date: "05-01", name: "Emek ve Dayanışma Günü" },
  { date: "05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { date: "07-15", name: "Demokrasi ve Millî Birlik Günü" },
  { date: "08-30", name: "Zafer Bayramı" },
  { date: "10-29", name: "Cumhuriyet Bayramı" },
];

export function isTurkishFixedHoliday(date: Date): boolean {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return TURKISH_FIXED_HOLIDAYS.some((h) => h.date === `${mm}-${dd}`);
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
): string[] {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots: string[] = [];
  for (let t = startTotal; t < endTotal; t += durationMin) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

// dateKey = "YYYY-MM-DD"
export function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}
