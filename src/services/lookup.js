import axiosInstance from '@/utils/axiosInstance'
import axios from 'axios'
import { API_ENDPOINTS, API_CONFIG } from '@/constants/api'
import { STORAGE_KEYS } from '@/constants/config'
import { cookieUtils } from '@/utils/cookies'

/**
 * lookupService - Referans Verileri Servisi
 *
 * Dropdown/Select bilesenlerinde kullanilacak referans verilerini
 * API'lerden ceken servis katmani.
 *
 * Endpointler:
 * - Ulke Listesi: /api/Country
 * - Otel Listesi: /api/Hotel
 * - Kullanici Listesi: https://umapi.dokugate.com/api/User/get-all
 */
export const lookupService = {
    /**
     * getCountries - Ulke listesini getir
     *
     * API Endpoint: GET /api/Country
     *
     * @returns {Promise<Array>} Ulke listesi
     *
     * Beklenen Response Format:
     * {
     *   error: false,
     *   data: [
     *     { id: 1, name: "Turkiye", code: "TR" },
     *     { id: 2, name: "Germany", code: "DE" },
     *     ...
     *   ],
     *   message: "Islem basarili",
     *   code: 200
     * }
     */
    async getCountries() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_COUNTRIES)
            // API response formatina gore data'yi dondur
            // axiosInstance interceptor zaten response.data donduruyor
            // eger data array ise direkt dondur, degilse data.items veya bos array dondur
            if (Array.isArray(response)) {
                return response
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items
            }
            return response || []
        } catch (error) {
            console.error('Error fetching countries:', error)
            throw error
        }
    },

    /**
     * getHotels - Otel listesini getir
     *
     * API Endpoint: GET /api/Hotel
     *
     * @returns {Promise<Array>} Otel listesi
     *
     * Beklenen Response Format:
     * {
     *   error: false,
     *   data: [
     *     { id: 1, name: "Hotel A", address: "..." },
     *     { id: 2, name: "Hotel B", address: "..." },
     *     ...
     *   ],
     *   message: "Islem basarili",
     *   code: 200
     * }
     */
    async getHotels() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_HOTELS)
            // API response formatina gore data'yi dondur
            if (Array.isArray(response)) {
                return response
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items
            }
            return response || []
        } catch (error) {
            console.error('Error fetching hotels:', error)
            throw error
        }
    },

    /**
     * getAirlines - Havayolu listesini getir
     *
     * API Endpoint: GET /api/Airline
     *
     * @returns {Promise<Array>} Havayolu listesi
     *
     * Beklenen Response Format:
     * {
     *   error: false,
     *   data: [
     *     { id: 1, name: "Turkish Airlines", code: "TK" },
     *     { id: 2, name: "Pegasus", code: "PC" },
     *     ...
     *   ],
     *   message: "Islem basarili",
     *   code: 200
     * }
     */
    async getAirlines() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_AIRLINES)
            // API response formatina gore data'yi dondur
            if (Array.isArray(response)) {
                return response
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items
            }
            return response || []
        } catch (error) {
            console.error('Error fetching airlines:', error)
            throw error
        }
    },

    /**
     * getUsers - Kullanici listesini getir (Doktor ve Satis Danismanlari)
     *
     * API Endpoint: GET https://umapi.dokugate.com/api/User/get-all?pageNumber=1&pageSize=1000
     *
     * NOT: Bu endpoint farkli bir domain'de (dokugate.com) oldugu icin
     * axios ile dogrudan istek yapiliyor. axiosInstance kullanilmiyor
     * cunku base URL farkli.
     *
     * @param {Object} params - Query parametreleri
     * @param {number} [params.pageNumber=1] - Sayfa numarasi
     * @param {number} [params.pageSize=1000] - Sayfa basina kayit sayisi
     * @returns {Promise<Array>} Kullanici listesi
     *
     * API Response Format:
     * {
     *   isSuccess: true,
     *   message: "success",
     *   result: [
     *     { id: "guid", fullName: "Ali Veli", accountName: "ali.veli", email: "...", title: "...", status: "Active" },
     *     ...
     *   ],
     *   totalCount: 271,
     *   pageNumber: 1,
     *   pageSize: 10
     * }
     */
    async getUsers(params = { pageNumber: 1, pageSize: 1000 }) {
        try {
            // Token'i localStorage veya cookie'den al
            let token = localStorage.getItem(STORAGE_KEYS.TOKEN)

            if (!token) {
                const authCookie = cookieUtils.getAuthCookie()
                if (authCookie && authCookie.authToken) {
                    token = authCookie.authToken
                }
            }

            // Farkli domain'e istek yapiliyor, axios kullaniliyor
            const response = await axios.get(API_ENDPOINTS.GET_USERS, {
                params,
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                timeout: API_CONFIG.TIMEOUT
            })

            // API response formatini isle
            const data = response.data

            // isSuccess formatinda response - result direkt array
            if (data?.isSuccess && data?.result) {
                // result direkt array olarak geliyor
                if (Array.isArray(data.result)) {
                    return data.result
                }
            }

            // Direkt array donuyorsa
            if (Array.isArray(data)) {
                return data
            }

            return data || []
        } catch (error) {
            console.error('Error fetching users:', error)
            throw error
        }
    },

    /**
     * getDoctors - Doktor listesini getir
     *
     * getUsers fonksiyonunu kullanarak doktor rolundeki kullanicilari filtreler
     *
     * @returns {Promise<Array>} Doktor listesi
     */
    async getDoctors() {
        try {
            const users = await this.getUsers()
            // Role'e gore filtreleme yapilabilir, API'den gelen veriye gore
            // Simdilik tum kullanicilari dondur
            return users || []
        } catch (error) {
            console.error('Error fetching doctors:', error)
            throw error
        }
    },

    /**
     * getSalesConsultants - Satis Danismani listesini getir
     *
     * getUsers fonksiyonunu kullanarak satis danismani rolundeki kullanicilari filtreler
     *
     * @returns {Promise<Array>} Satis danismani listesi
     */
    async getSalesConsultants() {
        try {
            const users = await this.getUsers()
            // Role'e gore filtreleme yapilabilir, API'den gelen veriye gore
            // Simdilik tum kullanicilari dondur
            return users || []
        } catch (error) {
            console.error('Error fetching sales consultants:', error)
            throw error
        }
    }
}

export default lookupService