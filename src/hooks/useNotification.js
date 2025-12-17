import { notification } from 'antd'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * useNotification - Bildirim (notification) yönetimi için custom hook
 *
 * Ant Design notification bileşenini kullanarak başarı, hata, uyarı
 * ve bilgi mesajları gösterir. Çoklu dil desteği ile birlikte çalışır.
 * Tüm bildirimler ekranın sağ üst köşesinde görüntülenir.
 *
 * @returns {Object} Notification fonksiyonları
 * @property {Function} showSuccess - Başarı bildirimi gösterir
 * @property {Function} showError - Hata bildirimi gösterir
 * @property {Function} showWarning - Uyarı bildirimi gösterir
 * @property {Function} showInfo - Bilgi bildirimi gösterir
 */
export const useNotification = () => {
    const { t } = useTranslation() // Çoklu dil desteği için

    /**
     * showSuccess - Başarılı işlem bildirimi gösterir (yeşil renk)
     *
     * @param {string} message - Bildirim başlığı (i18n key veya düz metin)
     * @param {string} [description] - Bildirim açıklaması (opsiyonel)
     */
    const showSuccess = useCallback((message, description) => {
        notification.success({
            message: t(message) || message, // Mesajı çevir, yoksa olduğu gibi kullan
            description: description ? (t(description) || description) : undefined, // Açıklama varsa çevir
            placement: 'topRight', // Ekranın sağ üstünde göster
        })
    }, [t])

    /**
     * showError - Hata bildirimi gösterir (kırmızı renk)
     *
     * @param {string} message - Bildirim başlığı (i18n key veya düz metin)
     * @param {string} [description] - Bildirim açıklaması (opsiyonel)
     */
    const showError = useCallback((message, description) => {
        notification.error({
            message: t(message) || message, // Mesajı çevir, yoksa olduğu gibi kullan
            description: description ? (t(description) || description) : undefined, // Açıklama varsa çevir
            placement: 'topRight', // Ekranın sağ üstünde göster
        })
    }, [t])

    /**
     * showWarning - Uyarı bildirimi gösterir (turuncu/sarı renk)
     *
     * @param {string} message - Bildirim başlığı (i18n key veya düz metin)
     * @param {string} [description] - Bildirim açıklaması (opsiyonel)
     */
    const showWarning = useCallback((message, description) => {
        notification.warning({
            message: t(message) || message, // Mesajı çevir, yoksa olduğu gibi kullan
            description: description ? (t(description) || description) : undefined, // Açıklama varsa çevir
            placement: 'topRight', // Ekranın sağ üstünde göster
        })
    }, [t])

    /**
     * showInfo - Bilgi bildirimi gösterir (mavi renk)
     *
     * @param {string} message - Bildirim başlığı (i18n key veya düz metin)
     * @param {string} [description] - Bildirim açıklaması (opsiyonel)
     */
    const showInfo = useCallback((message, description) => {
        notification.info({
            message: t(message) || message, // Mesajı çevir, yoksa olduğu gibi kullan
            description: description ? (t(description) || description) : undefined, // Açıklama varsa çevir
            placement: 'topRight', // Ekranın sağ üstünde göster
        })
    }, [t])

    // Hook'un döndürdüğü fonksiyonlar
    return {
        showSuccess,  // Başarı bildirimi
        showError,    // Hata bildirimi
        showWarning,  // Uyarı bildirimi
        showInfo,     // Bilgi bildirimi
    }
}