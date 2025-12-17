import { Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LoginForm from './LoginForm'

const { Title, Text } = Typography

/**
 * Login - Kullanıcı giriş sayfası bileşeni
 *
 * Kullanıcıların sisteme giriş yapabildiği sayfa. Modern ve şık bir tasarıma
 * sahiptir. Dekoratif arka plan elementleri, bulanık efektler ve gradient
 * renkler ile görsel çekicilik sağlar.
 *
 * Özellikler:
 * - Modern, minimalist tasarım
 * - Dekoratif arka plan elementleri (blur efektli daireler)
 * - Merkezi konumlandırılmış login kartı
 * - Logo ve uygulama bilgileri
 * - Responsive tasarım
 * - Glassmorphism efekti (backdrop-blur)
 * - CSS değişkenleri ile tema entegrasyonu
 *
 * Tasarım Özellikleri:
 * - Koyu gri arka plan (corporate-gray-800)
 * - Beyaz/yarı saydam kart (bg-white/95)
 * - Üst kenarda vurgulu border (secondary renk)
 * - Gölge ve blur efektleri
 * - Drop shadow'lu logo
 *
 * @returns {JSX.Element} Login sayfası
 */
const Login = () => {
    const { t } = useTranslation()   // Çoklu dil desteği
    const navigate = useNavigate()   // Sayfa yönlendirmeleri (şu an kullanılmıyor ama hazır)

    return (
        // Ana container - Tam ekran, merkezi hizalama, koyu gri arka plan
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'var(--corporate-gray-800)' }}
        >
            {/* Dekoratif Arka Plan Elementleri */}
            {/* absolute positioning ile tam ekran kaplayan container */}
            <div className="absolute inset-0 overflow-hidden">
                {/* 1. Dekoratif Element - Sağ üst köşe */}
                {/* Büyük blur'lu daire, yarı saydam */}
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 -mr-48 -mt-48"
                    style={{ background: 'var(--corporate-gray-700)' }}
                ></div>

                {/* 2. Dekoratif Element - Sol alt köşe */}
                {/* Büyük blur'lu daire, yarı saydam */}
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 -ml-48 -mb-48"
                    style={{ background: 'var(--corporate-gray-600)' }}
                ></div>

                {/* 3. Dekoratif Element - Merkez */}
                {/* Secondary color ile vurgulu orta element */}
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full filter blur-3xl opacity-10"
                    style={{ background: 'var(--corporate-secondary)' }}
                ></div>
            </div>

            {/* Login Card Container */}
            {/* z-10 ile dekoratif elementlerin üstünde konumlanır */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo ve Başlık Bölümü */}
                <div className="text-center mb-8">
                    {/* Uygulama Logosu */}
                    {/* drop-shadow-2xl: Güçlü gölge efekti */}
                    <img
                        src="/src/logo.png"
                        alt="Logo"
                        className="h-20 w-20 mx-auto mb-4 drop-shadow-2xl"
                    />

                    {/* Uygulama Adı - Environment değişkeninden */}
                    <h1 className="text-white text-3xl font-bold mb-2">
                        {import.meta.env.VITE_APP_NAME}
                    </h1>

                    {/* Proje Alt Başlığı - Environment değişkeninden */}
                    <p className="text-sm" style={{ color: 'var(--corporate-gray-300)' }}>
                        {import.meta.env.VITE_APP_PROJECT_NAME}
                    </p>
                </div>

                {/* Ana Login Kartı */}
                <Card
                    // Glassmorphism efekti: backdrop-blur-sm bg-white/95
                    // backdrop-blur: Arkadaki içeriği bulanıklaştırır
                    // bg-white/95: %95 opaklıkta beyaz arka plan
                    className="shadow-2xl border-0 backdrop-blur-sm bg-white/95"
                    style={{
                        borderRadius: '16px', // Yuvarlatılmış köşeler
                        borderTop: '4px solid var(--corporate-secondary)' // Üstte vurgulu border
                    }}
                >
                    {/* Kart İçeriği - Başlık ve Hoşgeldin Mesajı */}
                    <div className="text-center mb-6">
                        {/* "Giriş Yap" başlığı */}
                        <Title level={3} className="mb-2" style={{ color: 'var(--corporate-gray-900)' }}>
                            {t('auth.login')}
                        </Title>

                        {/* Hoş geldin mesajı - Parametreli çeviri */}
                        <Text style={{ color: 'var(--corporate-gray-500)' }}>
                            {t('messages.welcome', { appName: import.meta.env.VITE_APP_NAME })}
                        </Text>
                    </div>

                    {/* Login Form Bileşeni */}
                    {/* Email/password input'ları ve giriş butonu içerir */}
                    <LoginForm />
                </Card>
            </div>
        </div>
    )
}

export default Login