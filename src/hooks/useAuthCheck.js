import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { cookieUtils } from '@/utils/cookies'
import { clearAuth } from '@/store/slices/authSlice'
import { ROUTES } from '@/constants/routes'

/**
 * useAuthCheck - Authentication kontrolü için custom hook (Transfer Projesi)
 *
 * authUser cookie'sinin varlığını sürekli kontrol eder.
 * Cookie yoksa:
 * - Tüm localStorage verilerini temizler
 * - Redux store'u temizler
 * - Login sayfasına yönlendirir
 *
 * Özellikler:
 * - Otomatik cookie kontrolü
 * - localStorage temizleme
 * - Redux store temizleme
 * - Otomatik login redirect
 * - Periyodik kontrol (her 5 saniyede bir)
 *
 * Kullanım:
 * Protected route'larda veya layout component'lerinde çağrılır
 *
 * @param {Object} options - Yapılandırma seçenekleri
 * @param {number} options.checkInterval - Kontrol aralığı (milisaniye, varsayılan: 5000)
 * @param {boolean} options.redirectToLogin - Login'e yönlendir mi (varsayılan: true)
 */
export const useAuthCheck = (options = {}) => {
    const {
        checkInterval = 5000,
        redirectToLogin = true
    } = options

    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        /**
         * checkAuthCookie - Cookie'yi kontrol et ve gerekirse temizle
         */
        const checkAuthCookie = () => {
            // authUser cookie'sini al
            const authCookie = cookieUtils.getAuthCookie()

            // Cookie yoksa veya geçersizse
            if (!authCookie || !authCookie.authToken || !authCookie.authenticateResult) {
                console.warn('Auth cookie not found or invalid. Cleaning up...')

                // Cookie'yi temizle (otomatik olarak localStorage da temizlenir)
                cookieUtils.clearAuthCookie()

                // Redux store'u temizle
                dispatch(clearAuth())

                // Login sayfasına yönlendir
                if (redirectToLogin) {
                    navigate(ROUTES.LOGIN, { replace: true })
                }

                return false
            }

            return true
        }

        // İlk yüklemede kontrol et
        const isAuthenticated = checkAuthCookie()

        // Authenticated değilse interval kurma
        if (!isAuthenticated) {
            return
        }

        // Periyodik kontrol için interval kur
        const interval = setInterval(() => {
            const stillAuthenticated = checkAuthCookie()

            // Authenticated değilse interval'i temizle
            if (!stillAuthenticated) {
                clearInterval(interval)
            }
        }, checkInterval)

        // Cleanup: Component unmount olduğunda interval'i temizle
        return () => clearInterval(interval)
    }, [navigate, dispatch, checkInterval, redirectToLogin])
}

export default useAuthCheck