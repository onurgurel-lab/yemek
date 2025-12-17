import { Form, Input } from 'antd'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

/**
 * FormInput - React Hook Form ile entegre Ant Design form input bileşeni
 *
 * React Hook Form'un Controller bileşenini kullanarak Ant Design Input
 * bileşenlerini yönetir. Çoklu dil desteği ve hata yönetimi içerir.
 * Metin, şifre ve textarea input tiplerini destekler.
 *
 * @param {string} name - Form alanının adı (React Hook Form için)
 * @param {object} control - React Hook Form'dan gelen control objesi
 * @param {string} label - Input için görünen etiket metni
 * @param {string} placeholder - Input içinde gösterilecek placeholder metni
 * @param {string} type - Input tipi ('text', 'password', 'textarea', vb.)
 * @param {object} rules - React Hook Form validasyon kuralları
 * @param {object} error - Hata objesi (message içerebilir)
 * @param {object} props - Input bileşenine aktarılacak ek özellikler
 * @returns {JSX.Element} Controlled form input bileşeni
 */
const FormInput = ({
                       name,
                       control,
                       label,
                       placeholder,
                       type = 'text',
                       rules,
                       error,
                       ...props
                   }) => {
    // Çeviri fonksiyonunu al
    const { t } = useTranslation()

    /**
     * Hata mesajını formatlar ve gerekirse çevirir
     *
     * @returns {string|null} Çevrilmiş veya düz hata mesajı, yoksa null
     */
    const getErrorMessage = () => {
        // Hata yoksa null döndür
        if (!error) return null

        // Eğer error.message bir obje ise ve çeviri key'i içeriyorsa
        // i18n ile çevir (opsiyonel değişkenlerle birlikte)
        if (error.message && typeof error.message === 'object' && error.message.key) {
            return t(error.message.key, error.message.values || {})
        }

        // Eğer error.message string ise direkt göster
        return error.message
    }

    return (
        // React Hook Form Controller - Form input'unu kontrol eder
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => (
                // Ant Design Form.Item - Label ve hata mesajlarını yönetir
                <Form.Item
                    label={label}
                    // Hata varsa 'error' durumunu göster
                    validateStatus={error ? 'error' : ''}
                    // Hata mesajını göster
                    help={getErrorMessage()}
                >
                    {/* Input tipine göre uygun Ant Design bileşenini render et */}
                    {type === 'password' ? (
                        // Şifre input'u (göz ikonu ile göster/gizle)
                        <Input.Password
                            {...field}
                            placeholder={placeholder}
                            {...props}
                        />
                    ) : type === 'textarea' ? (
                        // Çok satırlı metin alanı
                        <Input.TextArea
                            {...field}
                            placeholder={placeholder}
                            {...props}
                        />
                    ) : (
                        // Standart input (text, email, number, vb.)
                        <Input
                            {...field}
                            type={type}
                            placeholder={placeholder}
                            {...props}
                        />
                    )}
                </Form.Item>
            )}
        />
    )
}

export default FormInput