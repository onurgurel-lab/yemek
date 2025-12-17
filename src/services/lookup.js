/**
 * Lookup Servis Modülü
 * Referans verileri (dropdown/select) API servisi
 */

import axiosInstance from '@/utils/axiosInstance';
import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG } from '@/constants/api';
import { STORAGE_KEYS } from '@/constants/config';
import { cookieUtils } from '@/utils/cookies';

/**
 * lookupService - Referans Verileri Servisi
 *
 * Dropdown/Select bileşenlerinde kullanılacak referans verilerini
 * API'lerden çeken servis katmanı.
 *
 * Endpoint'ler:
 * - Ülke Listesi: /api/Country
 * - Otel Listesi: /api/Hotel
 * - Kullanıcı Listesi: https://umapi.dokugate.com/api/User/get-all
 */
export const lookupService = {
    /**
     * getCountries - Ülke listesini getir
     *
     * API Endpoint: GET /api/Country
     *
     * @returns {Promise<Array>} Ülke listesi
     *
     * Beklenen Response Format:
     * {
     *   error: false,
     *   data: [
     *     { id: 1, name: "Türkiye", code: "TR" },
     *     { id: 2, name: "Germany", code: "DE" },
     *     ...
     *   ],
     *   message: "İşlem başarılı",
     *   code: 200
     * }
     */
    async getCountries() {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.GET_COUNTRIES);
            // API response formatına göre data'yı döndür
            // axiosInstance interceptor zaten response.data döndürüyor
            // eğer data array ise direkt döndür, değilse data.items veya boş array döndür
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
            console.error('getCountries error:', error);
            throw error;
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
     *     { id: 1, name: "Hilton Garden Inn", address: "..." },
     *     { id: 2, name: "Sheraton", address: "..." },
     *     ...
     *   ],
     *   message: "İşlem başarılı",
     *   code: 200
     * }
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
            console.error('getHotels error:', error);
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
            console.error('getAirlines error:', error);
            throw error;
        }
    },

    /**
     * getUsers - Kullanıcı listesini getir (Doktor, Danışman vb.)
     *
     * API Endpoint: GET https://umapi.dokugate.com/api/User/get-all
     *
     * DİKKAT: Bu endpoint farklı bir domain'de olduğu için
     * manuel token ekleme gerekebilir.
     *
     * @returns {Promise<Array>} Kullanıcı listesi
     *
     * Beklenen Response Format:
     * {
     *   error: false,
     *   data: [
     *     { id: 1, name: "Dr. Ahmet", role: "Doctor" },
     *     { id: 2, name: "Ayşe", role: "SalesConsultant" },
     *     ...
     *   ]
     * }
     */
    async getUsers() {
        try {
            // Token'ı al (cookie veya localStorage'dan)
            const token = cookieUtils.getCookie(STORAGE_KEYS.TOKEN) ||
                localStorage.getItem(STORAGE_KEYS.TOKEN);

            // Farklı domain olduğu için axios instance yerine direkt axios kullan
            const response = await axios.get(API_ENDPOINTS.GET_USERS, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                timeout: API_CONFIG.TIMEOUT,
            });

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
            console.error('getUsers error:', error);
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
 * // Select'te kullan
 * <Select options={countries.map(c => ({ value: c.id, label: c.name }))} />
 * ```
 *
 * 2. Otel listesi çekme:
 * ```javascript
 * const hotels = await lookupService.getHotels();
 * ```
 *
 * 3. Kullanıcı listesi çekme:
 * ```javascript
 * const users = await lookupService.getUsers();
 * const doctors = users.filter(u => u.role === 'Doctor');
 * ```
 */

export default lookupService;