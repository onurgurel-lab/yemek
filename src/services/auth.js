import axios from 'axios'
import { API_ENDPOINTS } from '@/constants/api'
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

                // User data
                const userData = {
                    id: result.id,
                    fullName: result.fullName,
                    username: result.userName,
                    email: result.email,
                    phoneNumber: result.phoneNumber,
                    profilePhoto: result.profilePhoto || null,
                    employeeId: result.employeeId,
                }

                // Cookie'ye kaydet
                const authCookieData = {
                    authenticateResult: true,
                    authToken: result.token,
                    userName: result.userName,
                    accessTokenExpireDate: result.expirationDate,
                    user: userData
                }

                cookieUtils.setAuthCookie(authCookieData)

                console.log('✅ Login successful')

                // Redux store için response
                return {
                    user: userData,
                    accessToken: result.token,
                    expirationDate: result.expirationDate,
                }
            } else {
                throw new Error(response.data.message || 'Login failed')
            }
        } catch (error) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Login failed')
            }
            throw error
        }
    },

    /**
     * validateToken - Token'ı validate et
     * ✅ Sadece user bilgilerini döndür
     */
    async validateToken(token) {
        try {
            console.log('🔄 Validating token...')

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

                console.log('✅ Token validated successfully')

                // User data + projects döndür
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
                console.error('❌ Token validation failed:', response.data.message)
                return null
            }
        } catch (error) {
            console.error('❌ Validate token error:', error.message)
            return null
        }
    },

    /**
     * logout - Kullanıcı çıkış işlemi
     */
    async logout() {
        cookieUtils.clearAuthCookie()
        console.log('✅ Logout successful')
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

            console.log('✅ Token refreshed')
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
            console.error('Token decode error:', error)
            return null
        }
    },
}