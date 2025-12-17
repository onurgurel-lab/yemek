import axiosInstance from '@/utils/axiosInstance'
import { API_ENDPOINTS } from '@/constants/api'

/**
 * dashboardService - Dashboard servisi
 *
 * Dashboard sayfası için gerekli API işlemlerini yöneten servis katmanı.
 * axiosInstance kullanarak API ile iletişim kurar.
 *
 * Özellikler:
 * - Son transferleri getirme
 * - Dashboard istatistikleri
 *
 * API İletişimi:
 * - axiosInstance kullanır (önceden yapılandırılmış axios)
 * - Otomatik token ekleme (interceptor ile)
 * - Otomatik error handling
 * - Response data extraction
 */
export const dashboardService = {
    /**
     * getRecentTransfers - Son transfer kayıtlarını getir
     *
     * Dashboard'da gösterilecek son transfer listesini getirir.
     * Varsayılan olarak en son 10 transfer kaydını döndürür.
     *
     * @param {Object} params - Query parametreleri
     * @param {number} [params.limit=10] - Getirilecek kayıt sayısı
     * @param {number} [params.pageNumber=1] - Sayfa numarası
     * @param {number} [params.pageSize=10] - Sayfa başına kayıt sayısı
     * @returns {Promise<Object>} API response - { data, totalRecords, ... }
     *
     * @example
     * // Basit kullanım - Son 10 transfer
     * const result = await dashboardService.getRecentTransfers()
     *
     * @example
     * // Özel limit ile
     * const result = await dashboardService.getRecentTransfers({ limit: 5 })
     */
    async getRecentTransfers(params = {}) {
        // GET istekleri için params query string olarak gönderilir
        const response = await axiosInstance.get(API_ENDPOINTS.GET_RECENT_TRANSFERS, { params })

        // axiosInstance zaten response.data döndürdüğü için
        // doğrudan response kullanılır
        return response || {}
    },

    /**
     * getDashboardStats - Dashboard istatistiklerini getir
     *
     * Dashboard'da gösterilecek özet istatistikleri getirir.
     * Toplam transfer, bugünkü transferler, tamamlanan transferler vb.
     *
     * @returns {Promise<Object>} API response - İstatistik verileri
     *
     * @example
     * const stats = await dashboardService.getDashboardStats()
     * console.log(stats.totalTransfers)
     */
    async getDashboardStats() {
        const response = await axiosInstance.get(API_ENDPOINTS.GET_DASHBOARD_STATS)
        return response || {}
    },
}

/**
 * API Response Formatı:
 *
 * getRecentTransfers() response:
 * {
 *   data: [...], // Son transfer kayıtları dizisi
 *   totalRecords: 100, // Toplam kayıt sayısı
 *   pageNumber: 1, // Mevcut sayfa
 *   pageSize: 10, // Sayfa başına kayıt
 *   totalPages: 10 // Toplam sayfa sayısı
 * }
 *
 * Transfer nesnesi yapısı (data array içinde):
 * {
 *   id: 123,
 *   patientName: 'Ahmet Yılmaz',
 *   transferType: 'arrival', // arrival, departure, intermediate
 *   transferDate: '2024-01-15T10:00:00Z',
 *   status: 'Planlandı', // Planlandı, Atandı, Yolda, Tamamlandı
 *   flightNo: 'TK1234',
 *   hotel: 'Hilton Garden Inn',
 *   ...
 * }
 */

/**
 * Error Handling:
 *
 * axiosInstance interceptor'ları otomatik error handling yapar:
 * - 401 Unauthorized: Token geçersiz, login'e yönlendir
 * - 403 Forbidden: Yetki yok, hata mesajı göster
 * - 404 Not Found: Kayıt bulunamadı
 * - 500 Server Error: Sunucu hatası
 */