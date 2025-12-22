/**
 * authService - Authentication işlemleri
 *
 * ✅ FIX v3: Login sonrası hem cookie HEM localStorage'a kaydet
 * Bu sayede token kesinlikle okunabilir olacak
 *
 * @module services/auth
 */

import axios from 'axios'
import { API_ENDPOINTS } from '@/constants/api'
import { STORAGE_KEYS } from '@/constants/config'
import { cookieUtils } from '@/utils/cookies'

/**
 * createFormData - Object'i FormData'ya dönüştürür
 */
const createFormData = (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value)
        }
    })
    return formData
}

/**
 * authService - Authentication işlemleri
 */
export const authService = {
    /**
     * login - Kullanıcı giriş işlemi
     *
     * ✅ FIX: Hem cookie HEM localStorage'a kaydet
     */
    async login(credentials) {
        try {
            const formData = createFormData(credentials)

            const response = await axios.post(
                API_ENDPOINTS.LOGIN,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            )

            if (response.data.isSuccess) {
                const result = response.data.result

                console.log('✅ Login API başarılı')
                console.log('🔑 Token alındı:', result.token ? 'VAR' : 'YOK')

                // User data
                const userData = {
                    id: result.id,
                    fullName: result.fullName,
                    username: result.userName,
                    email: result.email,
                    phoneNumber: result.phoneNumber,
                    profilePhoto: result.profilePhoto || null,
                    employeeId: result.employeeId,
                    projects: result.projects || [],
                }

                // ✅ FIX 1: Cookie'ye kaydet
                const authCookieData = {
                    authenticateResult: true,
                    authToken: result.token,
                    userName: result.userName,
                    accessTokenExpireDate: result.expirationDate,
                    user: userData
                }
                cookieUtils.setAuthCookie(authCookieData)

                // ✅ FIX 2: localStorage'a da kaydet (BACKUP)
                localStorage.setItem(STORAGE_KEYS.TOKEN, result.token)
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
                console.log('✅ Token localStorage\'a da kaydedildi')

                // Token'ın kaydedildiğini doğrula
                const savedToken = cookieUtils.getToken()
                const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
                console.log('🔍 Cookie\'den token:', savedToken ? 'VAR' : 'YOK')
                console.log('🔍 localStorage\'dan token:', localToken ? 'VAR' : 'YOK')

                return {
                    user: userData,
                    accessToken: result.token,
                    expirationDate: result.expirationDate,
                }
            } else {
                throw new Error(response.data.message || 'Login failed')
            }
        } catch (error) {
            console.error('❌ Login hatası:', error.message)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Login failed')
            }
            throw error
        }
    },

    /**
     * validateToken - Token'ı validate et
     */
    async validateToken(token) {
        try {
            console.log('🔄 Token doğrulanıyor...')

            const formData = createFormData({ token })

            const response = await axios.post(
                API_ENDPOINTS.VALIDATE,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            )

            if (response.data.isSuccess) {
                const result = response.data.result
                console.log('✅ Token doğrulandı')

                return {
                    id: result.id,
                    fullName: result.fullName,
                    username: result.username,
                    email: result.email,
                    phoneNumber: result.phoneNumber,
                    profilePhoto: result.profilePhoto,
                    employeeId: result.employeeId,
                    projects: result.projects || [],
                }
            } else {
                console.error('❌ Token doğrulama başarısız:', response.data.message)
                return null
            }
        } catch (error) {
            console.error('❌ Token doğrulama hatası:', error.message)
            return null
        }
    },

    /**
     * logout - Kullanıcı çıkış işlemi
     */
    async logout() {
        // Cookie'yi temizle
        cookieUtils.clearAuthCookie()

        // localStorage'ı da temizle
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)

        console.log('✅ Çıkış yapıldı')
        return true
    },

    /**
     * refreshToken - Token yenileme işlemi
     */
    async refreshToken() {
        const authCookie = cookieUtils.getAuthCookie()

        if (!authCookie?.refreshToken) {
            throw new Error('No refresh token available')
        }

        const formData = createFormData({ refreshToken: authCookie.refreshToken })
        const response = await axios.post(API_ENDPOINTS.REFRESH_TOKEN, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        if (response.data.isSuccess) {
            const newToken = response.data.result.token

            // Cookie'yi güncelle
            cookieUtils.updateToken(
                newToken,
                response.data.result.expirationDate
            )

            // localStorage'ı da güncelle
            localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)

            console.log('✅ Token yenilendi')
        }

        return response.data
    },

    /**
     * getCurrentUser - Cookie'den user bilgilerini al
     */
    getCurrentUser() {
        const authCookie = cookieUtils.getAuthCookie()
        return authCookie?.user || null
    },

    /**
     * decodeToken - JWT token'ı decode et
     */
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            return JSON.parse(jsonPayload)
        } catch (error) {
            console.error('Token decode hatası:', error)
            return null
        }
    },
}