import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import { login, logout, clearAuth } from '@/store/slices/authSlice'
import { ROUTES } from '@/constants/routes'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { cookieUtils } from '@/utils/cookies'

/**
 * useAuth - Kimlik doğrulama (authentication) işlemlerini yöneten custom hook
 *
 * Redux store'daki auth state'ini ve auth işlemlerini (login, logout)
 * yönetir. Kullanıcı girişi, çıkışı ve kimlik kontrolü için merkezi bir
 * interface sağlar. Component'larda auth işlemlerini kolayca kullanmak için
 * tasarlanmıştır.
 *
 * Özellikler:
 * - Sadece cookie tabanlı authentication
 * - localStorage otomatik temizleme
 * - Cookie yoksa otomatik logout ve redirect
 *
 * @returns {Object} Auth durumu ve fonksiyonları
 * @property {Object} user - Giriş yapmış kullanıcı bilgileri
 * @property {boolean} isAuthenticated - Kullanıcının giriş durumu
 * @property {boolean} loading - Auth işlemlerinin yükleme durumu
 * @property {string} error - Varsa auth hata mesajı
 * @property {Function} login - Kullanıcı giriş fonksiyonu
 * @property {Function} logout - Kullanıcı çıkış fonksiyonu
 * @property {Function} checkAuth - Kimlik doğrulama kontrolü
 */
export const useAuth = () => {
    const dispatch = useDispatch()      // Redux action'larını dispatch etmek için
    const navigate = useNavigate()      // Sayfa yönlendirmeleri için
    const { t } = useTranslation()      // Çoklu dil desteği için

    // Redux store'dan auth state'ini al
    const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth)

    /**
     * handleLogin - Kullanıcı giriş işlemini yönetir
     *
     * @param {Object} credentials - Kullanıcı giriş bilgileri (username, password)
     * @returns {Promise} Login işleminin sonucu
     * @throws {Error} Login başarısız olursa hata fırlatır
     */
    const handleLogin = useCallback(async (credentials) => {
        try {
            // Redux'taki login action'ını dispatch et ve sonucu bekle
            const result = await dispatch(login(credentials)).unwrap()

            if (result) {
                // Başarılı giriş mesajı göster
                message.success(t('auth.loginSuccess'))
                // Kullanıcıyı ana sayfaya yönlendir
                navigate(ROUTES.DASHBOARD)
                return result
            }
        } catch (error) {
            // Hata mesajı göster
            message.error(error || t('auth.loginError'))
            throw error
        }
    }, [dispatch, navigate, t])

    /**
     * handleLogout - Kullanıcı çıkış işlemini yönetir
     *
     * Redux'taki logout action'ını çağırır, başarısız olursa
     * auth state'ini temizler ve kullanıcıyı login sayfasına yönlendirir.
     * Cookie ve localStorage otomatik temizlenir.
     */
    const handleLogout = useCallback(async () => {
        try {
            // Redux'taki logout action'ını dispatch et
            await dispatch(logout()).unwrap()

            // Başarılı çıkış mesajı
            message.success(t('auth.logoutSuccess'))

            // Login sayfasına yönlendir
            navigate(ROUTES.LOGIN)
        } catch (error) {
            // Hata olsa bile çıkış yap
            console.error('Logout error:', error)

            // Auth state'ini temizle (cookie + localStorage temizlenir)
            dispatch(clearAuth())

            // Login sayfasına yönlendir
            navigate(ROUTES.LOGIN)
        }
    }, [dispatch, navigate, t])

    /**
     * checkAuth - Kimlik doğrulama kontrolü
     *
     * Cookie'nin varlığını kontrol eder.
     * Cookie yoksa veya geçersizse:
     * - localStorage temizler
     * - Redux store temizler
     * - Login sayfasına yönlendirir
     *
     * @returns {boolean} Authenticated ise true
     */
    const checkAuth = useCallback(() => {
        // Cookie kontrolü yap ve gerekirse temizle
        const isValid = cookieUtils.checkAndCleanup()

        if (!isValid) {
            // Cookie geçersiz veya yok
            console.warn('Auth cookie invalid. Redirecting to login...')

            // Redux store'u temizle
            dispatch(clearAuth())

            // Login sayfasına yönlendir
            navigate(ROUTES.LOGIN, { replace: true })

            return false
        }

        return true
    }, [dispatch, navigate])

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login: handleLogin,
        logout: handleLogout,
        checkAuth,
    }
}

/**
 * Kullanım Örnekleri:
 *
 * 1. Login Component'te:
 * ```javascript
 * const LoginPage = () => {
 *   const { login, loading } = useAuth()
 *
 *   const handleSubmit = async (values) => {
 *     await login(values)
 *   }
 *
 *   return <LoginForm onSubmit={handleSubmit} loading={loading} />
 * }
 * ```
 *
 * 2. Navbar Component'te:
 * ```javascript
 * const Navbar = () => {
 *   const { user, logout } = useAuth()
 *
 *   return (
 *     <div>
 *       <span>Welcome {user?.fullName}</span>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * 3. Protected Route'ta:
 * ```javascript
 * const ProtectedLayout = () => {
 *   const { checkAuth } = useAuth()
 *
 *   useEffect(() => {
 *     checkAuth() // Cookie kontrolü
 *   }, [checkAuth])
 *
 *   return <Outlet />
 * }
 * ```
 *
 * 4. Auth State Kontrolü:
 * ```javascript
 * const Dashboard = () => {
 *   const { isAuthenticated, user } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />
 *   }
 *
 *   return <div>Dashboard for {user.fullName}</div>
 * }
 * ```
 *
 * Önemli Notlar:
 * - handleLogout çağrıldığında cookie + localStorage otomatik temizlenir
 * - checkAuth cookie yoksa otomatik olarak temizlik yapar
 * - Tüm auth işlemleri sadece cookie üzerinden çalışır
 * - localStorage'a hiçbir şey kaydedilmez
 */