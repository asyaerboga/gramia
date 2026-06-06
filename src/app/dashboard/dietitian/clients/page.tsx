"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FaSearch,
  FaUserPlus,
  FaUsers,
  FaBolt,
  FaChartLine,
  FaComments,
  FaArrowRight,
  FaSortAmountDown,
  FaTimes,
} from "react-icons/fa";

interface ClientData {
  _id: string;
  name: string;
  image?: string | null;
  age: number;
  height: number;
  weight: number;
  startWeight: number;
  targetWeight: number;
  currentWeight: number;
  chronicDiseases: string[];
  totalCalories: number;
}

type SortKey = "name" | "progress" | "lost" | "calories";

/* ── Circular progress ring ─────────────────────── */
function ProgressRing({
  pct,
  size = 64,
}: {
  pct: number;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color =
    pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#6366f1";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#f3f4f6" strokeWidth="6"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={color}
      >
        %{Math.round(pct)}
      </text>
    </svg>
  );
}

/* ── Client card ────────────────────────────────── */
function ClientCard({
  client,
  onProfile,
}: {
  client: ClientData;
  onProfile: (id: string) => void;
}) {
  const totalChange = client.startWeight - client.targetWeight;
  const change = client.startWeight - client.currentWeight;
  const pct = totalChange !== 0 ? Math.min(Math.max((change / totalChange) * 100, 0), 100) : 0;
  const lost = Math.max(0, change);
  const bmi = client.height > 0
    ? +(client.currentWeight / Math.pow(client.height / 100, 2)).toFixed(1)
    : 0;
  const activeToday = client.totalCalories > 0;

  const accentColor =
    pct >= 75
      ? "from-emerald-400 to-teal-500"
      : pct >= 40
      ? "from-amber-400 to-orange-500"
      : "from-indigo-400 to-purple-500";

  const badgeColor =
    pct >= 75
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 40
      ? "bg-amber-100 text-amber-700"
      : "bg-indigo-100 text-indigo-700";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Gradient top strip */}
      <div className={`h-1.5 bg-gradient-to-r ${accentColor}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {client.image ? (
              <div className="w-11 h-11 rounded-xl shrink-0 shadow-sm overflow-hidden">
                <Image
                  src={client.image}
                  alt={client.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}>
                {client.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                {client.name}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {client.age} yaş · {client.height} cm · BMI {bmi}
              </p>
            </div>
          </div>
          {/* Active badge */}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            activeToday
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-400"
          }`}>
            {activeToday ? "● Aktif" : "● Pasif"}
          </span>
        </div>

        {/* Progress + ring */}
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing pct={pct} size={64} />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Hedef İlerlemesi</span>
              <span className={`font-semibold ${badgeColor.split(" ")[1]}`}>
                {lost > 0 ? `-${lost.toFixed(1)} kg` : "—"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${accentColor} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {client.currentWeight} kg → {client.targetWeight} kg
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Başlangıç</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{client.startWeight} kg</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Güncel</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{client.currentWeight} kg</p>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${activeToday ? "bg-emerald-50" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400">Bugün</p>
            <p className={`text-sm font-bold mt-0.5 ${activeToday ? "text-emerald-600" : "text-gray-400"}`}>
              {client.totalCalories > 0 ? `${client.totalCalories} kc` : "—"}
            </p>
          </div>
        </div>

        {/* Chronic diseases */}
        {client.chronicDiseases?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {client.chronicDiseases.slice(0, 2).map((d) => (
              <span key={d} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                {d}
              </span>
            ))}
            {client.chronicDiseases.length > 2 && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                +{client.chronicDiseases.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            href={`/dashboard/dietitian/messages`}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
          >
            <FaComments className="text-emerald-500" /> Mesaj
          </Link>
          <button
            onClick={() => onProfile(client._id)}
            className={`flex items-center justify-center gap-1.5 flex-1 py-2 text-xs font-medium text-white rounded-xl transition bg-gradient-to-r ${accentColor} hover:opacity-90`}
          >
            Profil <FaArrowRight className="text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
export default function DietitianClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    age: "", height: "", weight: "", targetWeight: "",
    chronicDiseases: "",
  });

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/clients");
      if (res.ok) setClients(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* ── Stats ──────────────────────────────────────── */
  const totalClients = clients.length;
  const activeToday = clients.filter((c) => c.totalCalories > 0).length;
  const avgProgress = clients.length
    ? clients.reduce((sum, c) => {
        const tl = c.startWeight - c.targetWeight;
        const ch = c.startWeight - c.currentWeight;
        return sum + (tl !== 0 ? Math.min(Math.max((ch / tl) * 100, 0), 100) : 0);
      }, 0) / clients.length
    : 0;

  /* ── Filtered & sorted ──────────────────────────── */
  const displayed = useMemo(() => {
    let list = clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
    switch (sortKey) {
      case "name":     list = list.sort((a, b) => a.name.localeCompare(b.name, "tr")); break;
      case "progress": {
        list = list.sort((a, b) => {
          const pct = (c: ClientData) => {
            const tl = c.startWeight - c.targetWeight;
            const ch = c.startWeight - c.currentWeight;
            return tl !== 0 ? Math.min(Math.max((ch / tl) * 100, 0), 100) : 0;
          };
          return pct(b) - pct(a);
        });
        break;
      }
      case "lost":     list = list.sort((a, b) => (b.startWeight - b.currentWeight) - (a.startWeight - a.currentWeight)); break;
      case "calories": list = list.sort((a, b) => b.totalCalories - a.totalCalories); break;
    }
    return list;
  }, [clients, search, sortKey]);

  /* ── Create client ───────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          age: parseInt(form.age), height: parseInt(form.height),
          weight: parseFloat(form.weight), targetWeight: parseFloat(form.targetWeight),
          chronicDiseases: form.chronicDiseases.split(",").map((d) => d.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name:"", email:"", password:"", age:"", height:"", weight:"", targetWeight:"", chronicDiseases:"" });
        fetchClients();
      }
    } finally { setCreating(false); }
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danışanlar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tüm danışanlarınızı yönetin</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
          >
            <FaUserPlus /> Yeni Danışan
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <FaUsers className="text-indigo-500 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              <p className="text-xs text-gray-500">Toplam Danışan</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <FaBolt className="text-emerald-500 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeToday}</p>
              <p className="text-xs text-gray-500">Bugün Aktif</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <FaChartLine className="text-amber-500 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">%{Math.round(avgProgress)}</p>
              <p className="text-xs text-gray-500">Ort. İlerleme</p>
            </div>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Danışan ara..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white/85 backdrop-blur-sm border border-emerald-200/60 rounded-xl px-3 py-2.5 text-sm shadow-sm hover:border-emerald-300/80 transition-colors">
            <FaSortAmountDown className="text-emerald-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent text-gray-700 focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="name">Ad (A-Z)</option>
              <option value="progress">İlerleme (Yüksek)</option>
              <option value="lost">Verilen Kilo</option>
              <option value="calories">Bugün Kalori</option>
            </select>
          </div>
        </div>

        {/* Client grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-gray-300 text-3xl" />
            </div>
            {search ? (
              <>
                <p className="text-gray-500 font-medium">"{search}" için sonuç bulunamadı</p>
                <button onClick={() => setSearch("")} className="mt-2 text-sm text-emerald-600 hover:underline">Aramayı temizle</button>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium mb-1">Henüz danışan yok</p>
                <p className="text-sm text-gray-400 mb-4">"Yeni Danışan" butonuyla başlayın.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition"
                >
                  + İlk Danışanı Ekle
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayed.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                onProfile={(id) => router.push(`/dashboard/dietitian/clients/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Yeni Danışan Ekle</h3>
                <p className="text-xs text-gray-400 mt-0.5">Danışan hesabı oluşturun</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Personal info */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Kişisel Bilgiler
                </label>
                <div className="space-y-3">
                  <input
                    type="text" required placeholder="Ad Soyad" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                  <input
                    type="email" required placeholder="E-posta" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                  <input
                    type="password" required placeholder="Şifre" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Body metrics */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Fiziksel Bilgiler
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Yaş", field: "age", type: "number" },
                    { label: "Boy (cm)", field: "height", type: "number" },
                    { label: "Kilo (kg)", field: "weight", type: "number" },
                    { label: "Hedef Kilo (kg)", field: "targetWeight", type: "number" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        type={type} required step="0.1"
                        value={form[field as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronic diseases */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Kronik Hastalıklar
                </label>
                <input
                  type="text" placeholder="Diyabet, Hipertansiyon... (virgülle ayırın)"
                  value={form.chronicDiseases}
                  onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit" disabled={creating}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  {creating ? "Oluşturuluyor..." : "Danışan Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
