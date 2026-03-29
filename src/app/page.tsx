import Link from "next/link";
import {
  FaRulerCombined,
  FaUtensils,
  FaCalendarCheck,
  FaComments,
  FaChartLine,
  FaShieldAlt,
  FaMobileAlt,
  FaUserMd,
  FaUsers,
  FaClipboardList,
  FaHeartbeat,
  FaTint,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";

const features = [
  {
    icon: <FaRulerCombined className="text-3xl text-emerald-500" />,
    title: "Detaylı Ölçüm Takibi",
    desc: "20+ vücut bölgesinde ölçüm kayıt ve takibi. Anatomik görselleştirme ile değişimleri net görün.",
    color: "bg-emerald-50",
  },
  {
    icon: <FaUtensils className="text-3xl text-orange-500" />,
    title: "Beslenme & Kalori",
    desc: "Öğün bazlı besin kaydı, kalori hesaplama, protein-karbonhidrat-yağ dağılım analizi.",
    color: "bg-orange-50",
  },
  {
    icon: <FaCalendarCheck className="text-3xl text-blue-500" />,
    title: "Akıllı Randevu",
    desc: "Online randevu alma, hatırlatma bildirimleri, takvim entegrasyonu ile randevu yönetimi.",
    color: "bg-blue-50",
  },
  {
    icon: <FaComments className="text-3xl text-purple-500" />,
    title: "Anlık Mesajlaşma",
    desc: "Diyetisyen-danışan arası güvenli mesajlaşma, dosya paylaşımı ve hızlı destek.",
    color: "bg-purple-50",
  },
  {
    icon: <FaChartLine className="text-3xl text-rose-500" />,
    title: "İlerleme Grafikleri",
    desc: "Kilo, ölçüm ve beslenme verilerinin trend analizi. Haftalık ve aylık raporlama.",
    color: "bg-rose-50",
  },
  {
    icon: <FaTint className="text-3xl text-cyan-500" />,
    title: "Su Takibi",
    desc: "Günlük su tüketimi takibi, hedef belirleme ve hatırlatıcılar ile hidrasyonu optimize edin.",
    color: "bg-cyan-50",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Diyetisyen Kaydı",
    desc: "Diyetisyen hesabınızı oluşturun ve profesyonel profilinizi tamamlayın.",
    icon: <FaUserMd className="text-2xl" />,
  },
  {
    step: "02",
    title: "Danışan Ekleme",
    desc: "Danışanlarınızı sisteme ekleyin, kişisel bilgilerini ve hedeflerini belirleyin.",
    icon: <FaUsers className="text-2xl" />,
  },
  {
    step: "03",
    title: "Ölçüm & Planlama",
    desc: "İlk ölçümleri alın, beslenme planı oluşturun ve hedefler belirleyin.",
    icon: <FaClipboardList className="text-2xl" />,
  },
  {
    step: "04",
    title: "Takip & Sonuç",
    desc: "Danışanlarınızın ilerlemesini takip edin, gerektiğinde planları güncelleyin.",
    icon: <FaHeartbeat className="text-2xl" />,
  },
];

const stats = [
  { value: "20+", label: "Ölçüm Bölgesi" },
  { value: "7/24", label: "Erişim" },
  { value: "100%", label: "Güvenli Veri" },
  { value: "∞", label: "Danışan Kapasitesi" },
];

const dietitianFeatures = [
  "Sınırsız danışan yönetimi",
  "Detaylı ölçüm ve analiz araçları",
  "Randevu takvimi ve hatırlatıcılar",
  "Danışan ilerleme raporları",
  "Güvenli mesajlaşma sistemi",
  "Beslenme planı oluşturma",
];

const clientFeatures = [
  "Kişisel gelişim takip paneli",
  "Günlük öğün ve kalori kaydı",
  "Su tüketimi takibi",
  "Ölçüm geçmişi ve grafikler",
  "Diyetisyen ile anlık iletişim",
  "Randevu alma ve yönetimi",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-2xl font-bold text-gray-900">Gramia</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-emerald-600 transition">Özellikler</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-emerald-600 transition">Nasıl Çalışır</a>
            <a href="#for-whom" className="text-sm text-gray-600 hover:text-emerald-600 transition">Kimler İçin</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-sm"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50/50 to-white" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-100 rounded-full blur-3xl opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <FaHeartbeat className="text-emerald-500" />
              Diyetisyen & Danışan Takip Platformu
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Sağlıklı yaşamda
              <span className="block text-emerald-600">dijital dönüşüm</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Gramia, diyetisyenler ve danışanlarını tek platformda buluşturur.
              Ölçüm takibi, beslenme planlaması, randevu yönetimi ve daha fazlası —
              hepsi bir arada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 text-lg"
              >
                Hemen Başla
                <FaArrowRight className="text-sm" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition border border-gray-200 text-lg"
              >
                Giriş Yap
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-2">
              <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl p-8 md:p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-gray-900">85.2</div>
                    <div className="text-xs text-gray-500">Kilo (kg)</div>
                    <div className="text-xs text-emerald-500 mt-1">↓ 2.3 kg</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="text-2xl font-bold text-gray-900">1,850</div>
                    <div className="text-xs text-gray-500">Kalori</div>
                    <div className="text-xs text-blue-500 mt-1">Hedefe uygun</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2">💧</div>
                    <div className="text-2xl font-bold text-gray-900">2.1L</div>
                    <div className="text-xs text-gray-500">Su Tüketimi</div>
                    <div className="text-xs text-cyan-500 mt-1">%84 tamamlandı</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2">📅</div>
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Randevu</div>
                    <div className="text-xs text-purple-500 mt-1">Bu hafta</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-emerald-100 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Özellikler</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">
              İhtiyacınız olan her şey tek platformda
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Gramia, diyetisyenlik süreçlerinizi dijitalleştirir ve verimliliğinizi artırır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group border border-gray-100"
              >
                <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Nasıl Çalışır</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">
              4 adımda başlayın
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Gramia&apos;yı kullanmaya başlamak çok kolay. Sadece birkaç dakikada sistemi kurun.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-emerald-100 -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-emerald-100">
                    <div className="text-emerald-600">{item.icon}</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Adım {item.step}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Whom - Dietitian & Client Features */}
      <section id="for-whom" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Kimler İçin</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">
              Diyetisyenler ve danışanları için tasarlandı
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dietitian Card */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FaUserMd className="text-2xl text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Diyetisyenler</h3>
                  <p className="text-sm text-gray-500">Profesyonel araçlar</p>
                </div>
              </div>
              <ul className="space-y-4">
                {dietitianFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="text-xs text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
              >
                Diyetisyen Olarak Başla
                <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {/* Client Card */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaUsers className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Danışanlar</h3>
                  <p className="text-sm text-gray-500">Kişisel takip araçları</p>
                </div>
              </div>
              <ul className="space-y-4">
                {clientFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="text-xs text-blue-600" />
                    </div>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login?role=client"
                className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition"
              >
                Danışan Girişi
                <FaArrowRight className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Technology */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FaShieldAlt className="text-xl text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Güvenli Altyapı</h3>
                  <p className="text-gray-400 text-sm">Verileriniz şifrelenerek güvenli sunucularda saklanır. KVKK uyumlu altyapı.</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FaMobileAlt className="text-xl text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Her Cihazda</h3>
                  <p className="text-gray-400 text-sm">Mobil, tablet ve bilgisayardan sorunsuz erişim. Responsive tasarım ile her ekran boyutuna uyum.</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FaChartLine className="text-xl text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Gerçek Zamanlı</h3>
                  <p className="text-gray-400 text-sm">Anlık veri güncellemeleri, canlı grafikler ve otomatik raporlama ile her şey güncel.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Dijital diyetisyenlik deneyimine
            <span className="text-emerald-600"> bugün başlayın</span>
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            Gramia ile danışanlarınızı daha etkin yönetin, iş süreçlerinizi otomatikleştirin
            ve daha iyi sonuçlar elde edin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 text-lg"
            >
              Ücretsiz Hesap Oluştur
              <FaArrowRight className="text-sm" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition border border-gray-200 text-lg"
            >
              Mevcut Hesapla Giriş
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌿</span>
                <span className="text-xl font-bold text-white">Gramia</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-md">
                Gramia, diyetisyenler ve danışanları bir araya getiren modern bir sağlık takip platformudur. 
                Ölçüm takibi, beslenme planlaması ve randevu yönetimi tek platformda.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-emerald-400 transition">Özellikler</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-400 transition">Nasıl Çalışır</a></li>
                <li><a href="#for-whom" className="hover:text-emerald-400 transition">Kimler İçin</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hesap</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/auth/register" className="hover:text-emerald-400 transition">Diyetisyen Kaydı</Link></li>
                <li><Link href="/auth/login?role=dietitian" className="hover:text-emerald-400 transition">Diyetisyen Girişi</Link></li>
                <li><Link href="/auth/login?role=client" className="hover:text-emerald-400 transition">Danışan Girişi</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2026 Gramia. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-6 text-sm">
              <span className="hover:text-emerald-400 transition cursor-pointer">Gizlilik Politikası</span>
              <span className="hover:text-emerald-400 transition cursor-pointer">Kullanım Şartları</span>
              <span className="hover:text-emerald-400 transition cursor-pointer">KVKK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
