/**
 * cookieUtils - Cookie yönetim yardımcı fonksiyonları
 *
 * ✅ FIX v3: Cookie encoding/decoding TAMAMEN düzeltildi
 *
 * SORUN:
 * - setAuthCookie: JSON → encodeURIComponent → cookie (DOĞRU)
 * - getAuthCookie: decodeURIComponent(document.cookie) → parse (YANLIŞ!)
 *
 * ÇÖZÜM:
 * - getAuthCookie: cookie değerini al → decodeURIComponent → parse (DOĞRU)
 */

const COOKIE_NAME = 'authUser'

export const cookieUtils = {
    /**
     * setAuthCookie - Authentication cookie'sini kaydet
     */
    setAuthCookie(authData, days = 7) {
        try {
            const cookieData = {
                authenticateResult: authData.authenticateResult || true,
                authToken: authData.authToken,
                userName: authData.userName,
                accessTokenExpireDate: authData.accessTokenExpireDate,
                user: authData.user
            }

            const jsonString = JSON.stringify(cookieData)
            const encodedData = encodeURIComponent(jsonString)

            const date = new Date()
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
            const expires = `expires=${date.toUTCString()}`

            // Cookie'yi kaydet
            document.cookie = `${COOKIE_NAME}=${encodedData}; ${expires}; path=/; SameSite=Lax`

            console.log('✅ Cookie kaydedildi')
            console.log('🔑 Token:', cookieData.authToken ? 'VAR (' + cookieData.authToken.substring(0, 20) + '...)' : 'YOK')

            // Hemen okuma testi yap
            const testRead = this.getAuthCookie()
            if (testRead?.authToken) {
                console.log('✅ Cookie okuma testi BAŞARILI')
            } else {
                console.error('❌ Cookie okuma testi BAŞARISIZ!')
            }
        } catch (error) {
            console.error('❌ Cookie kaydetme hatası:', error)
        }
    },

    /**
     * getAuthCookie - Authentication cookie'sini al
     *
     * ✅ DÜZELTME: Cookie değeri AYRI olarak decode ediliyor
     */
    getAuthCookie() {
        try {
            // Cookie string'ini al (raw halde)
            const cookieString = document.cookie

            if (!cookieString) {
                console.log('⚠️ document.cookie boş')
                return null
            }

            // Cookie'leri ayır
            const cookies = cookieString.split(';')

            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim()

                // authUser= ile başlayan cookie'yi bul
                if (cookie.startsWith(COOKIE_NAME + '=')) {
                    // Sadece değer kısmını al (authUser= kısmını çıkar)
                    const encodedValue = cookie.substring(COOKIE_NAME.length + 1)

                    if (!encodedValue) {
                        console.log('⚠️ Cookie değeri boş')
                        return null
                    }

                    // ✅ DÜZELTME: Değeri decode et
                    const decodedValue = decodeURIComponent(encodedValue)

                    // JSON parse et
                    const parsed = JSON.parse(decodedValue)

                    console.log('✅ Cookie okundu, token:', parsed.authToken ? 'VAR' : 'YOK')

                    return parsed
                }
            }

            console.log('⚠️ authUser cookie bulunamadı')
            return null
        } catch (error) {
            console.error('❌ Cookie okuma hatası:', error.message)
            // Debug için raw cookie'yi göster
            console.log('📋 Raw cookie:', document.cookie.substring(0, 100) + '...')
            return null
        }
    },

    /**
     * updateToken - Token'ı güncelle
     */
    updateToken(newToken, expirationDate) {
        try {
            const currentCookie = this.getAuthCookie()
            if (currentCookie) {
                this.setAuthCookie({
                    ...currentCookie,
                    authToken: newToken,
                    accessTokenExpireDate: expirationDate
                })
                console.log('✅ Token güncellendi')
            }
        } catch (error) {
            console.error('❌ Token güncelleme hatası:', error)
        }
    },

    /**
     * clearAuthCookie - Cookie'yi temizle
     */
    clearAuthCookie() {
        try {
            document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            console.log('✅ Cookie temizlendi')
        } catch (error) {
            console.error('❌ Cookie temizleme hatası:', error)
        }
    },

    /**
     * isAuthenticated - Kullanıcı giriş yapmış mı
     */
    isAuthenticated() {
        const authCookie = this.getAuthCookie()
        return !!(authCookie?.authToken && authCookie?.authenticateResult === true)
    },

    /**
     * getToken - Token'ı al
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

    /**
     * checkAndCleanup - Cookie kontrolü
     */
    checkAndCleanup() {
        const authCookie = this.getAuthCookie()
        if (!authCookie || !authCookie.authToken) {
            this.clearAuthCookie()
            return false
        }
        return true
    },

    /**
     * debugCookie - Debug bilgisi göster
     */
    debugCookie() {
        console.log('═══════════════════════════════════════')
        console.log('🔍 COOKIE DEBUG')
        console.log('═══════════════════════════════════════')
        console.log('📋 document.cookie uzunluğu:', document.cookie.length)
        console.log('📋 authUser var mı:', document.cookie.includes('authUser='))

        const parsed = this.getAuthCookie()
        if (parsed) {
            console.log('✅ Parse başarılı')
            console.log('   ├─ authToken:', parsed.authToken ? '✓ VAR' : '✗ YOK')
            console.log('   ├─ userName:', parsed.userName || 'YOK')
            console.log('   └─ user:', parsed.user ? '✓ VAR' : '✗ YOK')
            if (parsed.authToken) {
                console.log('   └─ Token önizleme:', parsed.authToken.substring(0, 50) + '...')
            }
        } else {
            console.log('❌ Parse başarısız veya cookie yok')
        }
        console.log('═══════════════════════════════════════')
    }
}