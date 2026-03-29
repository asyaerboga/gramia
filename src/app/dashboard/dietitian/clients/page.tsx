"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ClientCard from "@/components/dietitian/ClientCard";

interface ClientData {
  _id: string;
  name: string;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  clientName: string;
}

export default function DietitianClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    height: "",
    weight: "",
    targetWeight: "",
    chronicDiseases: "",
  });

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/appointments?upcoming=true");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchAppointments();
  }, [fetchClients, fetchAppointments]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          age: parseInt(form.age),
          height: parseInt(form.height),
          weight: parseFloat(form.weight),
          targetWeight: parseFloat(form.targetWeight),
          chronicDiseases: form.chronicDiseases
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          name: "",
          email: "",
          password: "",
          age: "",
          height: "",
          weight: "",
          targetWeight: "",
          chronicDiseases: "",
        });
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to create client:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-3/4 bg-green-50 min-h-screen p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">👥 Danışanlar</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
          >
            + Yeni Danışan Ekle
          </button>
        </div>

        {/* Client list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client._id}
              client={client}
              onViewProfile={(id) =>
                router.push(`/dashboard/dietitian/clients/${id}`)
              }
            />
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Henüz danışan yok</p>
            <p className="text-sm">
              &quot;Yeni Danışan Ekle&quot; butonuyla ilk danışanınızı
              oluşturun.
            </p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <aside className="w-full lg:w-1/4 bg-white lg:min-h-screen p-4 md:p-6 shadow-sm border-t lg:border-t-0 lg:border-l border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">
          📅 Yaklaşan Randevular
        </h3>
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div
                key={apt._id}
                className="bg-emerald-50 rounded-lg p-4 border border-emerald-100"
              >
                <p className="text-sm font-semibold text-gray-900">
                  📅{" "}
                  {new Date(apt.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-sm text-gray-600">⏰ {apt.time}</p>
                <p className="text-sm text-gray-500 mt-1">
                  👤 {apt.clientName}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">Yaklaşan randevu yok</p>
          )}
        </div>
      </aside>

      {/* Create Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Yeni Danışan Ekle
            </h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yaş
                  </label>
                  <input
                    type="number"
                    required
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Boy (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hedef Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.targetWeight}
                    onChange={(e) =>
                      setForm({ ...form, targetWeight: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kronik Hastalıklar (virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={form.chronicDiseases}
                  onChange={(e) =>
                    setForm({ ...form, chronicDiseases: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  placeholder="Diyabet, Hipertansiyon..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
