/**
 * axiosInstance.js - Merkezi Axios Yapılandırması
 *
 * ✅ FIX v3: Token handling TAMAMEN düzeltildi
 * - Inline cookie okuma fonksiyonu eklendi (bağımlılık sorunu yok)
 * - getAuthToken export ediliyor
 * - Debug logları eklendi
 *
 * @module utils/axiosInstance
 */

import axios from 'axios'
import { message } from 'antd'
import { API_CONFIG, HTTP_STATUS } from '@/constants/api'
import { STORAGE_KEYS } from '@/constants/config'
import { ERROR_MESSAGES } from '@/constants/messages'
import i18n from '@/translations/i18n'
import { createFormData } from './formDataHelper'

// Axios instance oluştur
const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
})

// ==================== INLINE COOKIE OKUMA ====================

/**
 * readAuthCookie - Cookie'yi doğru şekilde oku (INLINE)
 *
 * Bu fonksiyon cookies.js'den bağımsız çalışır
 * Böylece circular dependency veya import sorunu olmaz
 */
const readAuthCookie = () => {
    try {
        const cookieString = document.cookie

        if (!cookieString) {
            return null
        }

        const cookies = cookieString.split(';')

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim()

            if (cookie.startsWith('authUser=')) {
                // Sadece değer kısmını al
                const encodedValue = cookie.substring(9) // 'authUser='.length = 9

                if (!encodedValue) {
                    return null
                }

                // Değeri decode et ve parse et
                const decodedValue = decodeURIComponent(encodedValue)
                return JSON.parse(decodedValue)
            }
        }

        return null
    } catch (error) {
        console.error('❌ Cookie okuma hatası:', error.message)
        return null
    }
}

// ==================== TOKEN GETTER ====================

/**
 * getAuthToken - Token'ı güvenilir şekilde al
 *
 * ✅ EXPORT EDİLİYOR
 *
 * Öncelik sırası:
 * 1. Cookie'deki authToken
 * 2. localStorage'daki token (fallback)
 *
 * @returns {string|null} JWT token veya null
 */
export const getAuthToken = () => {
    try {
        // 1. Cookie'den oku
        const authCookie = readAuthCookie()

        if (authCookie?.authToken) {
            return authCookie.authToken
        }

        // 2. Alternatif key kontrolü
        if (authCookie?.token) {
            return authCookie.token
        }

        // 3. localStorage fallback
        const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
        if (localToken) {
            console.log('🔑 Token localStorage\'dan alındı')
            return localToken
        }

        return null
    } catch (error) {
        console.error('❌ getAuthToken hatası:', error)
        return null
    }
}

// ==================== REQUEST INTERCEPTOR ====================

axiosInstance.interceptors.request.use(
    (config) => {
        // Token'ı al
        const token = getAuthToken()

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('🔐 İstek:', config.method?.toUpperCase(), config.url)
            console.log('   └─ Token: ✓')
        } else {
            console.warn('⚠️ Token bulunamadı!')
            console.warn('❌ Request WITHOUT token:', config.url)
        }

        // Accept-Language header
        config.headers['Accept-Language'] = i18n?.language || 'tr'

        // Content-Type handling
        if (config.data && config.method === 'post') {
            if (
                !(config.data instanceof FormData) &&
                !(config.data instanceof URLSearchParams) &&
                !config.headers['Content-Type']
            ) {
                config.data = createFormData(config.data)
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
        } else if (config.data && ['put', 'patch'].includes(config.method)) {
            if (!config.headers['Content-Type']) {
                config.headers['Content-Type'] = 'application/json'
            }
        }

        return config
    },
    (error) => {
        console.error('❌ Request interceptor hatası:', error)
        return Promise.reject(error)
    }
)

// ==================== RESPONSE INTERCEPTOR ====================

axiosInstance.interceptors.response.use(
    (response) => {
        // API formatına göre düzenle
        if (response.data && response.data.isSuccess !== undefined) {
            if (response.data.isSuccess) {
                return response.data.result || response.data
            } else {
                const errorMessage = response.data.message || 'Sunucu hatası'
                message.error(errorMessage)
                return Promise.reject(new Error(errorMessage))
            }
        }
        return response.data
    },
    async (error) => {
        const originalRequest = error.config

        console.error('❌ API Error:', {
            url: originalRequest?.url,
            status: error.response?.status,
            message: error.message
        })

        // 401 Unauthorized
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
            originalRequest._retry = true
            console.log('🔄 401 - Token refresh deneniyor...')

            try {
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

                if (refreshToken) {
                    const formData = createFormData({ refreshToken })
                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}/auth/refresh`,
                        formData,
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    )

                    if (response.data.isSuccess) {
                        const { token } = response.data.result
                        console.log('✅ Token yenilendi')

                        localStorage.setItem(STORAGE_KEYS.TOKEN, token)

                        // Cookie'yi güncelle
                        const currentCookie = readAuthCookie() || {}
                        const updatedCookie = {
                            ...currentCookie,
                            authToken: token,
                            expirationDate: response.data.result.expirationDate
                        }

                        const jsonString = JSON.stringify(updatedCookie)
                        const encodedData = encodeURIComponent(jsonString)
                        const date = new Date()
                        date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000))
                        document.cookie = `authUser=${encodedData}; expires=${date.toUTCString()}; path=/; SameSite=Lax`

                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return axiosInstance(originalRequest)
                    }
                }
            } catch (refreshError) {
                console.error('❌ Token refresh başarısız:', refreshError)

                // Logout
                localStorage.removeItem(STORAGE_KEYS.TOKEN)
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.USER)
                document.cookie = 'authUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // Error messages
        if (error.response) {
            const errorMessage = error.response.data?.message || 'Sunucu hatası oluştu'
            message.error(errorMessage)
        } else if (error.request) {
            message.error('Ağ hatası oluştu')
        } else {
            message.error('Bir hata oluştu')
        }

        return Promise.reject(error)
    }
)

// ==================== DEBUG HELPER ====================

/**
 * debugToken - Console'da token durumunu göster
 */
export const debugToken = () => {
    console.log('═══════════════════════════════════════')
    console.log('🔍 TOKEN DEBUG')
    console.log('═══════════════════════════════════════')

    const cookie = readAuthCookie()
    console.log('Cookie parsed:', cookie ? '✓' : '✗')

    if (cookie) {
        console.log('authToken:', cookie.authToken ? cookie.authToken.substring(0, 30) + '...' : 'YOK')
        console.log('userName:', cookie.userName || 'YOK')
    }

    const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    console.log('localStorage token:', localToken ? '✓ VAR' : '✗ YOK')

    const finalToken = getAuthToken()
    console.log('Final token:', finalToken ? '✓ VAR' : '✗ YOK')
    console.log('═══════════════════════════════════════')
}

// ==================== EXPORTS ====================

export default axiosInstance