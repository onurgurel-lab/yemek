import axios from 'axios'
import { message } from 'antd'
import { API_CONFIG, HTTP_STATUS } from '@/constants/api'
import { STORAGE_KEYS } from '@/constants/config'
import { ERROR_MESSAGES } from '@/constants/messages'
import i18n from '@/translations/i18n'
import { cookieUtils } from './cookies'
import { createFormData } from './formDataHelper'

const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
})

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Token'ı localStorage'dan veya cookie'den al
        let token = localStorage.getItem(STORAGE_KEYS.TOKEN)

        if (!token) {
            const authCookie = cookieUtils.getAuthCookie()
            if (authCookie && authCookie.authToken) {
                token = authCookie.authToken
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        config.headers['Accept-Language'] = i18n.language

        // Sadece POST isteklerinde FormData'ya çevir
        // PUT ve PATCH istekleri JSON olarak gönderilir
        if (config.data && config.method === 'post') {
            // Eğer FormData veya URLSearchParams değilse ve headers'da Content-Type belirtilmemişse
            if (
                !(config.data instanceof FormData) &&
                !(config.data instanceof URLSearchParams) &&
                !config.headers['Content-Type']
            ) {
                // POST istekleri için default olarak form-urlencoded gönder
                config.data = createFormData(config.data)
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
        } else if (config.data && ['put', 'patch'].includes(config.method)) {
            // PUT ve PATCH istekleri için JSON gönder
            if (!config.headers['Content-Type']) {
                config.headers['Content-Type'] = 'application/json'
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // DokuClinic API formatına göre düzenle
        if (response.data && response.data.isSuccess !== undefined) {
            if (response.data.isSuccess) {
                return response.data.result || response.data
            } else {
                // API'den başarısız response geldi
                const errorMessage = response.data.message || i18n.t(ERROR_MESSAGES.SERVER_ERROR)
                message.error(errorMessage)
                return Promise.reject(new Error(errorMessage))
            }
        }
        return response.data
    },
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
                if (refreshToken) {
                    const formData = createFormData({ refreshToken })
                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}/auth/refresh`,
                        formData,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }
                    )

                    if (response.data.isSuccess) {
                        const { token } = response.data.result
                        localStorage.setItem(STORAGE_KEYS.TOKEN, token)

                        // Cookie'yi de güncelle
                        cookieUtils.setAuthCookie({
                            token: token,
                            username: localStorage.getItem('username'),
                            expirationDate: response.data.result.expirationDate
                        })

                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return axiosInstance(originalRequest)
                    }
                }
            } catch (refreshError) {
                // Refresh başarısız, logout yap
                localStorage.removeItem(STORAGE_KEYS.TOKEN)
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.USER)
                cookieUtils.clearAuthCookie()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // Handle error messages
        if (error.response) {
            const errorMessage = error.response.data?.message ||
                i18n.t(ERROR_MESSAGES.SERVER_ERROR)
            message.error(errorMessage)
        } else if (error.request) {
            message.error(i18n.t(ERROR_MESSAGES.NETWORK_ERROR) || 'Network error occurred')
        } else {
            message.error(i18n.t(ERROR_MESSAGES.UNKNOWN_ERROR) || 'An error occurred')
        }

        return Promise.reject(error)
    }
)

export default axiosInstance