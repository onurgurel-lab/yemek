import axiosInstance from '@/utils/axiosInstance'
import { API_ENDPOINTS } from '@/constants/api'
import { createFormData } from '@/utils/formDataHelper'

/**
 * exampleService - Example (Hasta kayıtları) CRUD servisi
 *
 * Post-operatif hasta kayıtları için API işlemlerini yöneten servis katmanı.
 * axiosInstance kullanarak API ile iletişim kurar.
 *
 * Özellikler:
 * - Liste getirme (pagination ve filtreleme ile)
 * - Tek kayıt getirme
 * - Yeni kayıt oluşturma
 * - Kayıt güncelleme
 * - Kayıt silme
 *
 * API İletişimi:
 * - axiosInstance kullanır (önceden yapılandırılmış axios)
 * - Otomatik token ekleme (interceptor ile)
 * - Otomatik error handling
 * - Response data extraction
 *
 * Not: axiosInstance zaten response.data döndürdüğü için
 * burada response.data yazmaya gerek yoktur.
 */
export const exampleService = {
    /**
     * getExamples - Hasta kayıtlarını listele
     *
     * Sunucu tarafı pagination ve filtreleme ile hasta listesini getirir.
     * Query parameters ile sayfalama ve arama yapılır.
     *
     * @param {Object} params - Query parametreleri
     * @param {number} [params.pageNumber=1] - Sayfa numarası
     * @param {number} [params.pageSize=30] - Sayfa başına kayıt sayısı
     * @param {string} [params.allData] - Genel arama metni (tüm alanlarda arar)
     * @param {string} [params.name] - Hasta adı filtresi
     * @returns {Promise<Object>} API response - { examples, totalRecords, pageNumber, pageSize, totalPages }
     *
     * @example
     * // Basit kullanım
     * const result = await exampleService.getExamples()
     *
     * @example
     * // Sayfalama ile
     * const result = await exampleService.getExamples({
     *   pageNumber: 2,
     *   pageSize: 50
     * })
     *
     * @example
     * // Filtreleme ile
     * const result = await exampleService.getExamples({
     *   allData: 'ahmet',
     *   name: 'Yılmaz'
     * })
     */
    async getExamples(params = {}) {
        // GET istekleri için params query string olarak gönderilir
        // Örnek: /postop/list?pageNumber=1&pageSize=30&allData=search
        const response = await axiosInstance.get(API_ENDPOINTS.GET_EXAMPLES, { params })

        // axiosInstance zaten response.data döndürdüğü için
        // response.data demeye gerek yok, doğrudan response kullanılır
        return response || {}
    },

    /**
     * getExampleById - Tek bir hasta kaydını ID ile getir
     *
     * Belirli bir hasta kaydının detaylarını getirir.
     * Düzenleme işlemi için kullanılır.
     *
     * @param {number} id - Hasta kaydının ID'si
     * @returns {Promise<Object>} Hasta kaydı detayları
     *
     * @example
     * const patient = await exampleService.getExampleById(123)
     * console.log(patient.patientFullName)
     */
    async getExampleById(id) {
        // Dynamic endpoint: /examples/{id}
        const response = await axiosInstance.get(API_ENDPOINTS.GET_EXAMPLE(id))
        return response
    },

    /**
     * createExample - Yeni hasta kaydı oluştur
     *
     * Form verilerini API'ye göndererek yeni hasta kaydı oluşturur.
     * POST isteği form data olarak gönderilir (axiosInstance otomatik çevirir).
     *
     * @param {Object} data - Hasta bilgileri
     * @param {string} data.patientFullName - Hasta adı soyadı
     * @param {string} data.patientEmail - E-posta adresi
     * @param {string} data.patientPhone - Telefon numarası
     * @param {string} data.doctor - Doktor adı
     * @param {string} data.salesConsultant - Satış danışmanı
     * @param {string} data.patientNation - Ülke
     * @param {string} data.operationDate - Operasyon tarihi (ISO string)
     * @param {number} data.postOpTypeId - Post-op tipi ID
     * @param {string} data.guide - Rehber
     * @returns {Promise<Object>} Oluşturulan kayıt
     *
     * @example
     * const newPatient = await exampleService.createExample({
     *   patientFullName: 'Ahmet Yılmaz',
     *   patientEmail: 'ahmet@example.com',
     *   patientPhone: '0532 123 4567',
     *   doctor: 'Dr. Mehmet Demir',
     *   salesConsultant: 'Ayşe Kaya',
     *   patientNation: 'Turkey',
     *   operationDate: '2024-01-15T10:00:00Z',
     *   postOpTypeId: 4,
     *   guide: 'Rehber Adı'
     * })
     */
    async createExample(data) {
        // POST istekleri form data olarak gönderilir
        // axiosInstance interceptor'ı otomatik olarak FormData'ya çevirir
        // Content-Type: application/x-www-form-urlencoded
        const response = await axiosInstance.post(API_ENDPOINTS.CREATE_EXAMPLE, data)
        return response
    },

    /**
     * updateExample - Mevcut hasta kaydını güncelle
     *
     * Belirli bir hasta kaydını ID ile bulur ve günceller.
     * PUT isteği JSON olarak gönderilir.
     *
     * @param {number} id - Güncellenecek kaydın ID'si
     * @param {Object} data - Güncellenmiş hasta bilgileri
     * @returns {Promise<Object>} Güncellenmiş kayıt
     *
     * @example
     * const updated = await exampleService.updateExample(123, {
     *   patientFullName: 'Ahmet Yılmaz (Güncellendi)',
     *   patientEmail: 'newemail@example.com'
     * })
     */
    async updateExample(id, data) {
        // PUT istekleri JSON olarak gönderilir
        // Dynamic endpoint: /examples/{id}
        const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_EXAMPLE(id), data)
        return response
    },

    /**
     * deleteExample - Hasta kaydını sil
     *
     * Belirli bir hasta kaydını ID ile siler.
     * Soft delete veya hard delete olabilir (API'ye bağlı).
     *
     * @param {number} id - Silinecek kaydın ID'si
     * @returns {Promise<Object>} Silme işlemi sonucu
     *
     * @example
     * await exampleService.deleteExample(123)
     * // Kayıt silindi
     */
    async deleteExample(id) {
        // DELETE isteği
        // Dynamic endpoint: /examples/{id}
        const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_EXAMPLE(id))
        return response
    },
}

/**
 * API Response Formatı:
 *
 * getExamples() response:
 * {
 *   examples: [...], // Hasta kayıtları dizisi
 *   totalRecords: 100, // Toplam kayıt sayısı
 *   pageNumber: 1, // Mevcut sayfa
 *   pageSize: 30, // Sayfa başına kayıt
 *   totalPages: 4 // Toplam sayfa sayısı
 * }
 *
 * getExampleById() response:
 * {
 *   id: 123,
 *   patientFullName: 'Ahmet Yılmaz',
 *   patientEmail: 'ahmet@example.com',
 *   // ... diğer alanlar
 * }
 *
 * createExample() / updateExample() response:
 * {
 *   isSuccess: true,
 *   message: 'İşlem başarılı',
 *   result: { ... } // Oluşturulan/güncellenen kayıt
 * }
 *
 * deleteExample() response:
 * {
 *   isSuccess: true,
 *   message: 'Kayıt silindi'
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
 *
 * Tüm hatalar catch bloğunda yakalanabilir:
 *
 * try {
 *   await exampleService.createExample(data)
 * } catch (error) {
 *   console.error('Create failed:', error.message)
 * }
 */

/**
 * Redux Integration:
 *
 * Bu servis fonksiyonları Redux thunk'larda kullanılır:
 *
 * export const fetchExamples = createAsyncThunk(
 *   'example/fetchExamples',
 *   async (params) => {
 *     const response = await exampleService.getExamples(params)
 *     return response
 *   }
 * )
 */