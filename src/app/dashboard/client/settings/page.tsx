"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  FaCog,
  FaUser,
  FaRuler,
  FaBullseye,
  FaAllergies,
  FaPills,
  FaSave,
} from "react-icons/fa";

interface ClientProfile {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  occupation: string;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
  allergies: string[];
  medications: string[];
  goals: string[];
}

const activityLevels = [
  { value: "sedentary", label: "Hareketsiz (Masa başı iş)", multiplier: 1.2 },
  { value: "light", label: "Hafif Aktif (Haftada 1-2 gün)", multiplier: 1.375 },
  {
    value: "moderate",
    label: "Orta Aktif (Haftada 3-5 gün)",
    multiplier: 1.55,
  },
  { value: "active", label: "Aktif (Haftada 6-7 gün)", multiplier: 1.725 },
  { value: "very_active", label: "Çok Aktif (Günde 2 kez)", multiplier: 1.9 },
];

const genderOptions = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Belirtmek istemiyorum" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "targets" | "health">(
    "profile",
  );
  const [profile, setProfile] = useState<ClientProfile>({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    address: "",
    occupation: "",
    height: 170,
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: "moderate",
    targetCalories: 1800,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 60,
    targetWater: 2.5,
    allergies: [],
    medications: [],
    goals: [],
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const { success, error } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/client/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || session?.user?.name || "",
          email: data.email || session?.user?.email || "",
          phone: data.phone || "",
          birthDate: data.birthDate
            ? new Date(data.birthDate).toISOString().split("T")[0]
            : "",
          gender: data.gender || "",
          address: data.address || "",
          occupation: data.occupation || "",
          height: data.height || 170,
          currentWeight: data.currentWeight || 70,
          targetWeight: data.targetWeight || 65,
          activityLevel: data.activityLevel || "moderate",
          targetCalories: data.targetCalories || 1800,
          targetProtein: data.targetProtein || 120,
          targetCarbs: data.targetCarbs || 200,
          targetFat: data.targetFat || 60,
          targetWater: data.targetWater || 2.5,
          allergies: data.allergies || [],
          medications: data.medications || [],
          goals: data.goals || [],
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
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, newAllergy.trim()],
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter((a) => a !== allergy),
    });
  };

  const addMedication = () => {
    if (
      newMedication.trim() &&
      !profile.medications.includes(newMedication.trim())
    ) {
      setProfile({
        ...profile,
        medications: [...profile.medications, newMedication.trim()],
      });
      setNewMedication("");
    }
  };

  const removeMedication = (medication: string) => {
    setProfile({
      ...profile,
      medications: profile.medications.filter((m) => m !== medication),
    });
  };

  const addGoal = () => {
    if (newGoal.trim() && !profile.goals.includes(newGoal.trim())) {
      setProfile({
        ...profile,
        goals: [...profile.goals, newGoal.trim()],
      });
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    setProfile({
      ...profile,
      goals: profile.goals.filter((g) => g !== goal),
    });
  };

  const calculateBMR = () => {
    // Mifflin-St Jeor Equation
    let bmr: number;
    const age = profile.birthDate
      ? Math.floor(
          (Date.now() - new Date(profile.birthDate).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : 30;

    if (profile.gender === "male") {
      bmr = 10 * profile.currentWeight + 6.25 * profile.height - 5 * age + 5;
    } else {
      bmr = 10 * profile.currentWeight + 6.25 * profile.height - 5 * age - 161;
    }

    const activity = activityLevels.find(
      (a) => a.value === profile.activityLevel,
    );
    const tdee = Math.round(bmr * (activity?.multiplier || 1.55));

    // For weight loss, subtract 500 calories
    const targetCal =
      profile.targetWeight < profile.currentWeight ? tdee - 500 : tdee;

    setProfile({
      ...profile,
      targetCalories: targetCal,
      targetProtein: Math.round((targetCal * 0.3) / 4), // 30% protein
      targetCarbs: Math.round((targetCal * 0.45) / 4), // 45% carbs
      targetFat: Math.round((targetCal * 0.25) / 9), // 25% fat
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaCog className="text-gray-500" />
              Ayarlar
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Profil ve hedef ayarlarınızı yönetin
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "profile", label: "Profil", icon: <FaUser /> },
            { id: "targets", label: "Hedefler", icon: <FaBullseye /> },
            { id: "health", label: "Sağlık", icon: <FaAllergies /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "profile" | "targets" | "health")
              }
              className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-6">
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Telefon
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
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) =>
                    setProfile({ ...profile, birthDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Meslek
                </label>
                <input
                  type="text"
                  value={profile.occupation}
                  onChange={(e) =>
                    setProfile({ ...profile, occupation: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Örn: Yazılım Geliştirici"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Adres</label>
              <textarea
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="İl, İlçe..."
              />
            </div>
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === "targets" && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-6">
            {/* Body Measurements */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaRuler className="text-emerald-500" /> Vücut Ölçüleri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Boy (cm)
                  </label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        height: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Mevcut Kilo (kg)
                  </label>
                  <input
                    type="number"
                    value={profile.currentWeight}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        currentWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Hedef Kilo (kg)
                  </label>
                  <input
                    type="number"
                    value={profile.targetWeight}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Aktivite Seviyesi
              </label>
              <div className="space-y-2">
                {activityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      setProfile({ ...profile, activityLevel: level.value })
                    }
                    className={`w-full px-4 py-3 text-left rounded-lg border-2 transition ${
                      profile.activityLevel === level.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Calculate Button */}
            <button
              type="button"
              onClick={calculateBMR}
              className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200"
            >
              🧮 Hedefleri Otomatik Hesapla
            </button>

            {/* Nutrition Targets */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBullseye className="text-emerald-500" /> Günlük Hedefler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Kalori (kcal)
                  </label>
                  <input
                    type="number"
                    value={profile.targetCalories}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetCalories: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Su (litre)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.targetWater}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetWater: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={profile.targetProtein}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetProtein: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Karbonhidrat (g)
                  </label>
                  <input
                    type="number"
                    value={profile.targetCarbs}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetCarbs: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Yağ (g)
                  </label>
                  <input
                    type="number"
                    value={profile.targetFat}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetFat: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Personal Goals */}
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Kişisel Hedeflerim
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addGoal()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Örn: 5 km koşmak"
                />
                <button
                  type="button"
                  onClick={addGoal}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.goals.map((goal) => (
                  <span
                    key={goal}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {goal}
                    <button
                      type="button"
                      onClick={() => removeGoal(goal)}
                      className="text-emerald-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            {/* Allergies */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaAllergies className="text-red-500" /> Alerjiler
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Örn: Fıstık, Gluten, Laktoz..."
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.length === 0 ? (
                  <p className="text-sm text-gray-400">Alerji eklenmedi</p>
                ) : (
                  profile.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Medications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaPills className="text-blue-500" /> İlaçlar
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addMedication()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Metformin, Vitamin D..."
                />
                <button
                  type="button"
                  onClick={addMedication}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.medications.length === 0 ? (
                  <p className="text-sm text-gray-400">İlaç eklenmedi</p>
                ) : (
                  profile.medications.map((med) => (
                    <span
                      key={med}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {med}
                      <button
                        type="button"
                        onClick={() => removeMedication(med)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Bu bilgiler diyetisyeniniz tarafından görüntülenebilir ve diyet
              planınızda dikkate alınacaktır.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
