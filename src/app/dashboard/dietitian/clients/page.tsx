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
  FaTrash,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaUserSlash,
  FaUserCheck,
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
    pct === 0 ? "#6366f1" : pct >= 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

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
  onDelete,
}: {
  client: ClientData;
  onProfile: (id: string) => void;
  onDelete: (id: string, name: string) => void;
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
    pct === 0
      ? "from-indigo-400 to-purple-500"
      : pct >= 100
      ? "from-emerald-400 to-teal-500"
      : pct >= 50
      ? "from-amber-400 to-orange-500"
      : "from-red-400 to-rose-500";

  const badgeColor =
    pct === 0
      ? "bg-indigo-100 text-indigo-700"
      : pct >= 100
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 50
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

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
          <button
            onClick={() => onDelete(client._id, client.name)}
            title="Danışanı kaldır"
            className="flex items-center justify-center w-8 h-8 mt-auto text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
          >
            <FaTrash className="text-xs" />
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveClients, setInactiveClients] = useState<{ _id: string; name: string; email: string; image: string | null; age: number }[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    gender: "" as "" | "male" | "female",
    age: "", height: "", weight: "", targetWeight: "",
    activityLevel: "moderate" as "sedentary" | "light" | "moderate" | "active" | "very_active",
    chronicDiseases: "", allergies: "", medications: "",
    goals: "", occupation: "",
    targetCalories: "", targetProtein: "", targetCarbs: "",
    targetFat: "", targetWater: "",
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
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          age: parseInt(form.age), height: parseInt(form.height),
          weight: parseFloat(form.weight), targetWeight: parseFloat(form.targetWeight),
          activityLevel: form.activityLevel,
          chronicDiseases: form.chronicDiseases.split(",").map((d) => d.trim()).filter(Boolean),
          allergies: form.allergies.split(",").map((d) => d.trim()).filter(Boolean),
          medications: form.medications.split(",").map((d) => d.trim()).filter(Boolean),
          goals: form.goals.split(",").map((d) => d.trim()).filter(Boolean),
          occupation: form.occupation || undefined,
          targetCalories: form.targetCalories ? parseInt(form.targetCalories) : undefined,
          targetProtein: form.targetProtein ? parseInt(form.targetProtein) : undefined,
          targetCarbs: form.targetCarbs ? parseInt(form.targetCarbs) : undefined,
          targetFat: form.targetFat ? parseInt(form.targetFat) : undefined,
          targetWater: form.targetWater ? parseFloat(form.targetWater) : undefined,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          name:"", email:"", password:"", phone:"",
          gender:"", age:"", height:"", weight:"", targetWeight:"",
          activityLevel:"moderate", chronicDiseases:"", allergies:"",
          medications:"", goals:"", occupation:"",
          targetCalories:"", targetProtein:"", targetCarbs:"",
          targetFat:"", targetWater:"",
        });
        fetchClients();
      }
    } finally { setCreating(false); }
  };

  /* ── Inactive clients ───────────────────────────── */
  const fetchInactiveClients = useCallback(async () => {
    setLoadingInactive(true);
    try {
      const res = await fetch("/api/dietitian/clients/inactive");
      if (res.ok) setInactiveClients(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingInactive(false); }
  }, []);

  const handleToggleInactive = () => {
    if (!showInactive) fetchInactiveClients();
    setShowInactive((v) => !v);
  };

  const handleActivate = async (id: string) => {
    setActivating(id);
    try {
      const res = await fetch(`/api/dietitian/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        setInactiveClients((prev) => prev.filter((c) => c._id !== id));
        fetchClients();
      }
    } finally { setActivating(null); }
  };

  /* ── Delete client ───────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dietitian/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c._id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally { setDeleting(false); }
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Hero Banner ──────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 px-6 py-6 md:px-8 text-white shadow-xl shadow-orange-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Yönetim Paneli</p>
                <h1 className="text-2xl md:text-3xl font-bold">Danışanlar</h1>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition border border-white/20"
              >
                <FaUserPlus size={12} /> Yeni Danışan
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-blue-600 rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-blue-500">
                <FaUsers className="text-white text-lg drop-shadow" />
                <span className="text-2xl font-bold">{totalClients}</span>
                <span className="text-blue-100 text-xs font-medium leading-tight">Toplam<br/>Danışan</span>
              </div>
              <div className="bg-red-600 rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-red-500">
                <FaBolt className="text-white text-lg drop-shadow" />
                <span className="text-2xl font-bold">{activeToday}</span>
                <span className="text-red-100 text-xs font-medium leading-tight">Bugün<br/>Aktif</span>
              </div>
              <div className="bg-violet-600 rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-violet-500">
                <FaChartLine className="text-white text-lg drop-shadow" />
                <span className="text-2xl font-bold">%{Math.round(avgProgress)}</span>
                <span className="text-violet-100 text-xs font-medium leading-tight">Ort.<br/>İlerleme</span>
              </div>
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
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <FaSortAmountDown className="text-emerald-400 shrink-0" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent text-gray-700 text-sm focus:outline-none cursor-pointer appearance-none"
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
                <p className="text-gray-500 font-medium">&quot;{search}&quot; için sonuç bulunamadı</p>
                <button onClick={() => setSearch("")} className="mt-2 text-sm text-emerald-600 hover:underline">Aramayı temizle</button>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium mb-1">Henüz danışan yok</p>
                <p className="text-sm text-gray-400 mb-4">&quot;Yeni Danışan&quot; butonuyla başlayın.</p>
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
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}
          </div>
        )}
        {/* Pasife Alınmış Danışanlar */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={handleToggleInactive}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <FaUserSlash className="text-gray-400 text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Pasife Alınmış Danışanlar</p>
                <p className="text-xs text-gray-400">Kaldırılan danışanları görüntüle ve geri al</p>
              </div>
            </div>
            {showInactive ? (
              <FaChevronUp className="text-gray-400 text-sm shrink-0" />
            ) : (
              <FaChevronDown className="text-gray-400 text-sm shrink-0" />
            )}
          </button>

          {showInactive && (
            <div className="border-t border-gray-100 bg-gray-50">
              {loadingInactive ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : inactiveClients.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-6 text-gray-400">
                  <FaUserSlash className="text-2xl text-gray-200" />
                  <p className="text-sm">Pasife alınmış danışan yok</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {inactiveClients.map((c) => (
                    <li key={c._id} className="flex items-center gap-3 px-5 py-3">
                      {c.image ? (
                        <Image src={c.image} alt={c.name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                      <button
                        onClick={() => handleActivate(c._id)}
                        disabled={activating === c._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition disabled:opacity-50 shrink-0"
                      >
                        <FaUserCheck className="text-[11px]" />
                        {activating === c._id ? "..." : "Aktifleştir"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <FaExclamationTriangle className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Danışanı Kaldır</h3>
                <p className="text-xs text-gray-400 mt-0.5">Bu işlem geri alınabilir</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{deleteTarget.name}</span> adlı danışan listenizden kaldırılacak. Danışanın tüm verileri korunacak.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? "Kaldırılıyor..." : "Kaldır"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Yeni Danışan Ekle</h3>
                <p className="text-xs text-gray-400 mt-0.5">Danışan profilini eksiksiz doldurun</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">

              {/* ── Hesap Bilgileri ── */}
              <section>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Hesap Bilgileri</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Ad Soyad *</label>
                    <input
                      type="text" required placeholder="Ayşe Yılmaz" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-posta *</label>
                    <input
                      type="email" required placeholder="ayse@email.com" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Şifre *</label>
                    <input
                      type="password" required placeholder="••••••••" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefon</label>
                    <input
                      type="tel" placeholder="0530 000 00 00" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Meslek</label>
                    <input
                      type="text" placeholder="Öğretmen, Mühendis..." value={form.occupation}
                      onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                </div>
              </section>

              {/* ── Kişisel & Fiziksel ── */}
              <section>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Kişisel & Fiziksel Bilgiler</p>

                {/* Cinsiyet */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-2">Cinsiyet *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "female", label: "Kadın", emoji: "♀" },
                      { value: "male", label: "Erkek", emoji: "♂" },
                    ] as const).map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, gender: value })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                          form.gender === value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-base">{emoji}</span> {label}
                      </button>
                    ))}
                  </div>
                  {!form.gender && (
                    <p className="text-[11px] text-gray-400 mt-1">BMR ve kalori hesabı için gereklidir</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Yaş *", field: "age", placeholder: "28", step: "1" },
                    { label: "Boy (cm) *", field: "height", placeholder: "165", step: "1" },
                    { label: "Mevcut Kilo (kg) *", field: "weight", placeholder: "72.5", step: "0.1" },
                    { label: "Hedef Kilo (kg) *", field: "targetWeight", placeholder: "65.0", step: "0.1" },
                  ].map(({ label, field, placeholder, step }) => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        type="number" required step={step} placeholder={placeholder}
                        value={form[field as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      />
                    </div>
                  ))}
                </div>

                {/* Aktivite Seviyesi */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Aktivite Seviyesi</label>
                  <select
                    value={form.activityLevel}
                    onChange={(e) => setForm({ ...form, activityLevel: e.target.value as typeof form.activityLevel })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                  >
                    <option value="sedentary">Hareketsiz — Masa başı iş, az egzersiz</option>
                    <option value="light">Hafif Aktif — Haftada 1-3 gün egzersiz</option>
                    <option value="moderate">Orta Aktif — Haftada 3-5 gün egzersiz</option>
                    <option value="active">Aktif — Haftada 6-7 gün yoğun egzersiz</option>
                    <option value="very_active">Çok Aktif — Günde iki antrenman veya ağır iş</option>
                  </select>
                </div>
              </section>

              {/* ── Sağlık Bilgileri ── */}
              <section>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Sağlık Bilgileri</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kronik Hastalıklar</label>
                    <input
                      type="text" placeholder="Diyabet Tip 2, Hipertansiyon... (virgülle ayırın)"
                      value={form.chronicDiseases}
                      onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alerjiler & Gıda Hassasiyeti</label>
                    <input
                      type="text" placeholder="Glüten, Laktoz, Fıstık... (virgülle ayırın)"
                      value={form.allergies}
                      onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kullanılan İlaçlar / Takviyeler</label>
                    <input
                      type="text" placeholder="Metformin, D3 vitamini... (virgülle ayırın)"
                      value={form.medications}
                      onChange={(e) => setForm({ ...form, medications: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hedefler / Danışan Notları</label>
                    <input
                      type="text" placeholder="Kilo vermek, kas yapmak, sağlıklı beslenmek... (virgülle ayırın)"
                      value={form.goals}
                      onChange={(e) => setForm({ ...form, goals: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                </div>
              </section>

              {/* ── Beslenme Hedefleri ── */}
              <section>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Beslenme Hedefleri</p>
                <p className="text-[11px] text-gray-400 mb-3">Boş bırakılırsa sistem otomatik hesaplar</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Günlük Kalori Hedefi (kcal)</label>
                    <input
                      type="number" step="50" placeholder="1800"
                      value={form.targetCalories}
                      onChange={(e) => setForm({ ...form, targetCalories: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                  {[
                    { label: "Protein (g)", field: "targetProtein", placeholder: "130" },
                    { label: "Karbonhidrat (g)", field: "targetCarbs", placeholder: "200" },
                    { label: "Yağ (g)", field: "targetFat", placeholder: "60" },
                    { label: "Su Hedefi (L)", field: "targetWater", placeholder: "2.5" },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        type="number" step="0.1" placeholder={placeholder}
                        value={form[field as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit" disabled={creating || !form.gender}
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
