"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/providers/ToastProvider";
import { FaCog, FaSave, FaCamera, FaTrash, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

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

const genderOptions = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Belirtmek istemiyorum" },
];

function resizeImageToBase64(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
  const { success, error } = useToast();

  const fetchAvatar = useCallback(async () => {
    try {
      const res = await fetch("/api/user/avatar");
      if (res.ok) {
        const data = await res.json();
        setAvatarImage(data.image);
      }
    } catch (err) {
      console.error("Failed to fetch avatar:", err);
    }
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    try {
      const resized = await resizeImageToBase64(file);
      const blob = await fetch(resized).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setAvatarImage(data.image);
        success("Güncellendi", "Profil fotoğrafınız güncellendi.");
      } else {
        error("Hata", "Fotoğraf yüklenemedi.");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      error("Hata", "Fotoğraf yüklenemedi.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/upload/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarImage(null);
        success("Kaldırıldı", "Profil fotoğrafınız kaldırıldı.");
      }
    } catch (err) {
      console.error("Avatar remove error:", err);
    } finally {
      setAvatarUploading(false);
    }
  };

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
    fetchAvatar();
  }, [fetchProfile, fetchAvatar]);

  const handlePasswordChange = async () => {
    if (passwordForm.next !== passwordForm.confirm) {
      error("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
      });
      const data = await res.json();
      if (res.ok) {
        success("Güncellendi", "Şifreniz başarıyla değiştirildi.");
        setPasswordForm({ current: "", next: "", confirm: "" });
      } else {
        error("Hata", data.error || "Şifre değiştirilemedi.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      error("Hata", "Şifre değiştirilemedi.");
    } finally {
      setPasswordSaving(false);
    }
  };

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
              Profil bilgilerinizi yönetin
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

        {/* Profile Photo */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Profil Fotoğrafı</h2>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarImage}
                  alt="Profil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl border-2 border-emerald-200">
                  {profile.name?.charAt(0) || session?.user?.name?.charAt(0) || "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition shadow-md disabled:opacity-50"
              >
                <FaCamera className="text-xs" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="flex items-center gap-2 px-4 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition text-sm disabled:opacity-50"
              >
                <FaCamera className="text-xs" />
                {avatarUploading ? "Yükleniyor..." : "Fotoğraf Seç"}
              </button>
              {avatarImage && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition text-sm disabled:opacity-50"
                >
                  <FaTrash className="text-xs" />
                  Fotoğrafı Kaldır
                </button>
              )}
              <p className="text-xs text-gray-400">JPG, PNG, WebP — maks. 5MB</p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaLock className="text-emerald-500" />
            Şifre Değiştir
          </h2>
          <div className="space-y-4">
            {(["current", "next", "confirm"] as const).map((field) => {
              const labels = { current: "Mevcut Şifre", next: "Yeni Şifre", confirm: "Yeni Şifre (Tekrar)" };
              return (
                <div key={field} className="relative">
                  <label className="text-sm text-gray-600 block mb-1">{labels[field]}</label>
                  <input
                    type={showPasswords[field] ? "text" : "password"}
                    value={passwordForm[field]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[field] ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              );
            })}
            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !passwordForm.current || !passwordForm.next || !passwordForm.confirm}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 text-sm"
            >
              <FaLock className="text-xs" />
              {passwordSaving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
            </button>
          </div>
        </div>

        {/* Profile */}
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
                className="date-modern w-full"
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
                className="select-modern w-full"
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
      </div>
    </div>
  );
}
