"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/providers/ToastProvider";
import { FaCog, FaUser, FaSave } from "react-icons/fa";

interface DietitianProfile {
  name: string;
  email: string;
  phone: string;
  gender: string;
}

const genderOptions = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Belirtmek istemiyorum" },
];

export default function DietitianSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DietitianProfile>({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });
  const { success, error } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || session?.user?.name || "",
          email: data.email || session?.user?.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.name, session?.user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dietitian/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          gender: profile.gender,
        }),
      });
      if (res.ok) {
        success("Kaydedildi", "Profil bilgileriniz güncellendi.");
      } else {
        error("Hata", "Profil güncellenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      error("Hata", "Profil güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaCog className="text-gray-500" />
              Ayarlar
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kişisel bilgilerinizi güncelleyin
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
          >
            <FaSave />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <FaUser className="text-emerald-500" />
            Kişisel Bilgiler
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Cinsiyet
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seçiniz</option>
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
