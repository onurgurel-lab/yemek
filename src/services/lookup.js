/**
 * Lookup Servis Modülü
 * Referans verileri (dropdown/select) API servisi
 *
 * ✅ FIX: Token handling düzeltildi
 * - getAuthToken import edildi
 * - Farklı domain isteklerinde token doğru ekleniyor
 *
 * @module services/lookup
 */

import axiosInstance, { getAuthToken } from '@/utils/axiosInstance';
import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG } from '@/constants/api';

/**
 * lookupService - Referans Verileri Servisi
 *
 * Dropdown/Select bileşenlerinde kullanılacak referans verilerini
 * API'lerden çeken servis katmanı.
 *
 * Endpoint'ler:
 * - Ülke Listesi: /api/Country
 * - Otel Listesi: /api/Hotel
 * - Havayolu Listesi: /api/Airline
 * - Kullanıcı Listesi: https://umapi.dokugate.com/api/User/get-all
 */
export const lookupService = {
    /**
     * getCountries - Ülke listesini getir
     *
     * API Endpoint: GET /api/Country
     *
     * @returns {Promise<Array>} Ülke listesi
     */
    async getCountries() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_COUNTRIES);

            if (Array.isArray(response)) {
                return response;
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items;
            }
            return response || [];
        } catch (error) {
            console.error('❌ getCountries error:', error);
            throw error;
        }
    },

    /**
     * getHotels - Otel listesini getir
     *
     * API Endpoint: GET /api/Hotel
     *
     * @returns {Promise<Array>} Otel listesi
     */
    async getHotels() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_HOTELS);

            if (Array.isArray(response)) {
                return response;
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items;
            }
            return response || [];
        } catch (error) {
            console.error('❌ getHotels error:', error);
            throw error;
        }
    },

    /**
     * getAirlines - Havayolu listesini getir
     *
     * API Endpoint: GET /api/Airline
     *
     * @returns {Promise<Array>} Havayolu listesi
     */
    async getAirlines() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_AIRLINES);

            if (Array.isArray(response)) {
                return response;
            }
            if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            if (response?.items && Array.isArray(response.items)) {
                return response.items;
            }
            return response || [];
        } catch (error) {
            console.error('❌ getAirlines error:', error);
            throw error;
        }
    },

    /**
     * getUsers - Kullanıcı listesini getir (Doktor, Danışman vb.)
     *
     * API Endpoint: GET https://umapi.dokugate.com/api/User/get-all
     *
     * ✅ FIX: Token artık doğru şekilde alınıyor ve ekleniyor
     *
     * @returns {Promise<Array>} Kullanıcı listesi
     */
    async getUsers() {
        try {
            // ✅ Token'ı merkezi fonksiyondan al
            const token = getAuthToken();

            if (!token) {
                console.error('❌ getUsers: Token bulunamadı!');
                console.error('📋 Debug: Cookie kontrolü yapılıyor...');

                // Debug için cookie durumunu logla
                if (typeof document !== 'undefined') {
                    console.error('📋 Raw cookies:', document.cookie ? 'Cookies exist' : 'No cookies');
                }

                throw new Error('Authentication token not found. Please login again.');
            }

            console.log('🔐 getUsers: Token alındı, istek gönderiliyor...');
            console.log('   └─ Token preview:', token.substring(0, 30) + '...');

            // Farklı domain olduğu için axios instance yerine direkt axios kullan
            const response = await axios.get(API_ENDPOINTS.GET_USERS, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                timeout: API_CONFIG.TIMEOUT,
            });

            console.log('✅ getUsers: Başarılı response alındı');

            const data = response.data;

            if (Array.isArray(data)) {
                return data;
            }
            if (data?.data && Array.isArray(data.data)) {
                return data.data;
            }
            if (data?.items && Array.isArray(data.items)) {
                return data.items;
            }
            return data || [];
        } catch (error) {
            console.error('❌ getUsers error:', error);

            // 401 hatası için özel handling
            if (error.response?.status === 401) {
                console.error('❌ 401 Unauthorized - Token geçersiz veya süresi dolmuş');
                console.error('📋 Request headers:', error.config?.headers);
                throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
            }

            // Network hatası
            if (error.code === 'ECONNABORTED') {
                throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
            }

            throw error;
        }
    },
};

/**
 * Kullanım Örnekleri:
 *
 * 1. Ülke listesi çekme:
 * ```javascript
 * const countries = await lookupService.getCountries();
 * <Select options={countries.map(c => ({ value: c.id, label: c.name }))} />
 * ```
 *
 * 2. Otel listesi çekme:
 * ```javascript
 * const hotels = await lookupService.getHotels();
 * <Select options={hotels.map(h => ({ value: h.id, label: h.name }))} />
 * ```
 *
 * 3. Kullanıcı listesi çekme:
 * ```javascript
 * const users = await lookupService.getUsers();
 * const doctors = users.filter(u => u.role === 'Doctor');
 * ```
 */

export default lookupService;