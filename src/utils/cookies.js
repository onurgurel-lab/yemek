/**
 * cookieUtils - Cookie yönetim yardımcı fonksiyonları
 * ✅ localStorage kullanımını KALDIRDIK
 */

const COOKIE_NAME = 'authUser'

export const cookieUtils = {
    /**
     * setAuthCookie - Authentication cookie'sini kaydet
     * ✅ Artık localStorage'a KAYDETMIYORUZ
     */
    setAuthCookie(authData, days = 7) {
        try {
            const cookieData = {
                authenticateResult: authData.authenticateResult || true,
                authToken: authData.authToken,
                userName: authData.userName,
                accessTokenExpireDate: authData.accessTokenExpireDate,
                user: authData.user // User bilgisini cookie içinde tut
            }

            const jsonString = JSON.stringify(cookieData)
            const encodedData = encodeURIComponent(jsonString)

            const date = new Date()
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
            const expires = `expires=${date.toUTCString()}`

            document.cookie = `${COOKIE_NAME}=${encodedData}; ${expires}; path=/; SameSite=Strict`

            console.log('✅ Auth cookie set successfully')
        } catch (error) {
            console.error('❌ Error setting auth cookie:', error)
        }
    },

    /**
     * getAuthCookie - Authentication cookie'sini al
     */
    getAuthCookie() {
        try {
            const name = `${COOKIE_NAME}=`
            const decodedCookie = decodeURIComponent(document.cookie)
            const cookies = decodedCookie.split(';')

            for (let cookie of cookies) {
                cookie = cookie.trim()
                if (cookie.indexOf(name) === 0) {
                    const cookieValue = cookie.substring(name.length)
                    return JSON.parse(cookieValue)
                }
            }
            return null
        } catch (error) {
            console.error('❌ Error getting auth cookie:', error)
            return null
        }
    },

    /**
     * updateToken - Sadece token'ı güncelle
     */
    updateToken(newToken, expirationDate) {
        try {
            const currentCookie = this.getAuthCookie()

            if (currentCookie) {
                const updatedData = {
                    ...currentCookie,
                    authToken: newToken,
                    accessTokenExpireDate: expirationDate
                }
                this.setAuthCookie(updatedData)
                console.log('✅ Token updated in cookie')
            }
        } catch (error) {
            console.error('❌ Error updating token:', error)
        }
    },

    /**
     * clearAuthCookie - Cookie'yi temizle
     * ✅ Artık localStorage'ı TEMİZLEMİYORUZ
     */
    clearAuthCookie() {
        try {
            document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
            console.log('✅ Auth cookie cleared successfully')
        } catch (error) {
            console.error('❌ Error clearing auth cookie:', error)
        }
    },

    /**
     * isAuthenticated - Kullanıcı authenticate edilmiş mi kontrol et
     */
    isAuthenticated() {
        const authCookie = this.getAuthCookie()
        return !!(authCookie?.authToken && authCookie?.authenticateResult === true)
    },

    /**
     * getToken - Access token'ı al
     */
    getToken() {
        const authCookie = this.getAuthCookie()
        return authCookie?.authToken || null
    },

    /**
     * getUser - Kullanıcı bilgilerini al
     */
    getUser() {
        const authCookie = this.getAuthCookie()
        return authCookie?.user || null
    },
}