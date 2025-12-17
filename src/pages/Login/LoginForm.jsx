import { Button, Form } from 'antd'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { loginSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import FormInput from '@/components/form/FormInput'

/**
 * LoginForm - Kullanıcı giriş formu bileşeni
 *
 * Kullanıcı adı ve şifre ile giriş yapılmasını sağlayan form.
 * React Hook Form ile form yönetimi, Yup ile validasyon kullanır.
 *
 * Özellikler:
 * - Email/username ve password input'ları
 * - Form validasyonu (Yup schema)
 * - Yükleme durumu göstergesi (loading state)
 * - İkonlu input'lar (UserOutlined, LockOutlined)
 * - Çoklu dil desteği
 * - Responsive tasarım
 * - Custom stil ve renkler
 *
 * Kullanım:
 * Login sayfasında (<Login />) render edilir.
 * useAuth hook'u ile authentication işlemlerini yönetir.
 *
 * @returns {JSX.Element} Login form bileşeni
 */
const LoginForm = () => {
    const { t } = useTranslation()      // Çoklu dil desteği
    const { login, loading } = useAuth() // Auth hook'undan login fonksiyonu ve yükleme durumu

    /**
     * React Hook Form setup
     *
     * - resolver: Yup validation schema ile entegrasyon
     * - defaultValues: Form alanlarının başlangıç değerleri
     */
    const {
        control,        // Form kontrolcüsü (Controller bileşenleri için)
        handleSubmit,   // Form submit handler wrapper'ı
        formState: { errors }, // Form hataları
    } = useForm({
        resolver: yupResolver(loginSchema), // Yup schema ile validasyon
        defaultValues: {
            username: '', // Kullanıcı adı başlangıç değeri
            password: '', // Şifre başlangıç değeri
        },
    })

    /**
     * onSubmit - Form gönderildiğinde çalışan fonksiyon
     *
     * Form verilerini alır ve useAuth hook'undaki login fonksiyonuna gönderir.
     * Başarılı olursa kullanıcı ana sayfaya yönlendirilir (useAuth içinde).
     * Hata durumunda konsola log yazdırır.
     *
     * @param {Object} data - Form verileri (username, password)
     */
    const onSubmit = async (data) => {
        try {
            // useAuth hook'undaki login fonksiyonunu çağır
            // Bu fonksiyon Redux action'ını dispatch eder ve başarılı olursa yönlendirme yapar
            await login(data)
        } catch (error) {
            // Hata durumunda konsola yazdır
            // useAuth hook'u zaten kullanıcıya bildirim gösterir
            console.error('Login error:', error)
        }
    }

    return (
        // Ant Design Form - Vertical layout (dikey düzen)
        // handleSubmit(onSubmit): React Hook Form'un submit handler'ı
        <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
            {/* Kullanıcı Adı Input'u */}
            <FormInput
                name="username"
                control={control}
                // Label'da custom stil (text-gray-700)
                label={<span className="text-gray-700">{t('auth.username')}</span>}
                placeholder={t('auth.username')}
                // Prefix: Input'un solunda gösterilen ikon
                prefix={<UserOutlined className="text-gray-400" />}
                error={errors.username}     // Validasyon hatası
                size="large"                // Büyük boyutlu input
                className="border-gray-300" // Border rengi
            />

            {/* Şifre Input'u */}
            <FormInput
                name="password"
                control={control}
                label={<span className="text-gray-700">{t('auth.password')}</span>}
                placeholder={t('auth.password')}
                type="password"             // Password tipi (karakterleri gizler)
                // Prefix: Kilit ikonu
                prefix={<LockOutlined className="text-gray-400" />}
                error={errors.password}
                size="large"
                className="border-gray-300"
            />

            {/* Giriş Butonu */}
            <Form.Item>
                <Button
                    type="primary"          // Primary stil (mavi arka plan)
                    htmlType="submit"       // HTML form submit butonu
                    loading={loading}       // Yükleme durumunda spinner göster
                    size="large"            // Büyük boyutlu buton
                    // w-full: Tam genişlik, h-12: 48px yükseklik
                    className="w-full h-12 font-semibold text-base"
                    style={{
                        // Loading değilse custom renk (#06b6d4 - cyan-500)
                        // Loading'daysa Ant Design'ın varsayılan rengini kullan
                        background: loading ? undefined : '#06b6d4',
                    }}
                >
                    {t('auth.login')} {/* "Giriş Yap" metni */}
                </Button>
            </Form.Item>
        </Form>
    )
}

export default LoginForm

/**
 * Form Akışı:
 *
 * 1. Kullanıcı username ve password girer
 * 2. Her tuş vuruşunda Yup validation çalışır (real-time validation)
 * 3. "Giriş Yap" butonuna tıklanır
 * 4. handleSubmit validasyonu kontrol eder
 * 5. Valid ise onSubmit fonksiyonu çalışır
 * 6. login fonksiyonu Redux action'ını dispatch eder
 * 7. API'ye istek gönderilir
 * 8. Başarılı ise:
 *    - Token localStorage'a kaydedilir
 *    - Kullanıcı bilgileri Redux store'a yazılır
 *    - Ana sayfaya yönlendirme yapılır
 *    - Başarı bildirimi gösterilir
 * 9. Başarısız ise:
 *    - Hata bildirimi gösterilir
 *    - Form temizlenmez (kullanıcı düzeltebilir)
 *
 * Validasyon Kuralları (loginSchema):
 * - username: Zorunlu alan
 * - password: Zorunlu alan
 *
 * Güvenlik:
 * - Şifre input'u type="password" ile maskelenir
 * - Token'lar güvenli şekilde localStorage'da saklanır
 * - API istekleri HTTPS üzerinden gönderilir
 */