/**
 * Dashboard Servis Modülü
 * Dashboard ile ilgili API isteklerini yönetir
 */

import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * dashboardService - Dashboard veri servisi
 *
 * Dashboard sayfasında gösterilecek istatistik ve son transfer verilerini
 * API'den çeker.
 */
export const dashboardService = {
    /**
     * getRecentTransfers - Son transferleri getirir
     *
     * Dashboard'da son eklenen veya güncellenmiş transfer kayıtlarını
     * listeler. Sayfalama desteği vardır.
     *
     * @param {number} pageNumber - Sayfa numarası (varsayılan: 1)
     * @param {number} pageSize - Sayfa başına kayıt sayısı (varsayılan: 10)
     * @returns {Promise<Object>} API response - Son transferler
     *
     * @example
     * const transfers = await dashboardService.getRecentTransfers(1, 10)
     * console.log(transfers.data)
     */
    async getRecentTransfers(pageNumber = 1, pageSize = 10) {
        const response = await axiosInstance.get(API_ENDPOINTS.GET_RECENT_TRANSFERS, {
            params: {
                pageNumber,
                pageSize,
            },
        });
        return response || { data: [], totalRecords: 0 };
    },

    /**
     * getDashboardStats - Dashboard istatistiklerini getirir
     *
     * Toplam transfer, bugünkü transferler, tamamlanan transferler vb.
     *
     * @returns {Promise<Object>} API response - İstatistik verileri
     *
     * @example
     * const stats = await dashboardService.getDashboardStats()
     * console.log(stats.totalTransfers)
     */
    async getDashboardStats() {
        const response = await axiosInstance.get(API_ENDPOINTS.GET_DASHBOARD_STATS);
        return response || {};
    },
};

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
 *
 * getDashboardStats() response:
 * {
 *   totalTransfers: 1500,
 *   todayTransfers: 25,
 *   completedTransfers: 1200,
 *   pendingTransfers: 300,
 *   monthlyStats: {
 *     january: 120,
 *     february: 135,
 *     ...
 *   }
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

export default dashboardService;