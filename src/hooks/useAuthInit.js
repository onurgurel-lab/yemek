import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { validateAndLoadUser } from '@/store/slices/authSlice'

/**
 * useAuthInit - Uygulama başlatıldığında auth durumunu kontrol et
 *
 * Cookie'de token varsa validate eder ve user bilgilerini yükler.
 * Bu hook sadece bir kez çalışır (uygulama başlangıcında).
 *
 * Özellikler:
 * - Cookie'deki token'ı otomatik validate eder
 * - User bilgilerini localStorage'dan yükler
 * - Token geçersizse cookie'yi temizler
 * - Loading state'i döndürür
 *
 * @returns {Object} Auth init durumu
 * @property {boolean} loading - İlk yükleme devam ediyor mu
 * @property {boolean} initialized - İlk yükleme tamamlandı mı
 * @property {boolean} isAuthenticated - Kullanıcı authenticate mi
 */
export const useAuthInit = () => {
    const dispatch = useDispatch()
    const { loading, initialized, isAuthenticated } = useSelector((state) => state.auth)

    useEffect(() => {
        // Sadece ilk yüklemede çalışsın
        if (!initialized) {
            console.log('Initializing auth from cookie...')
            dispatch(validateAndLoadUser())
        }
    }, [dispatch, initialized])

    return {
        loading,
        initialized,
        isAuthenticated,
    }
}

/**
 * Kullanım Örnekleri:
 *
 * 1. App.jsx'te (Ana component):
 * ```javascript
 * import { useAuthInit } from '@/hooks/useAuthInit'
 *
 * function App() {
 *   const { loading, initialized } = useAuthInit()
 *
 *   // İlk yükleme devam ediyorsa loading göster
 *   if (!initialized) {
 *     return <LoadingSpinner />
 *   }
 *
 *   return <Routes>...</Routes>
 * }
 * ```
 *
 * 2. AppWrapper.jsx'te:
 * ```javascript
 * function AppWrapper({ children }) {
 *   const { initialized, isAuthenticated } = useAuthInit()
 *
 *   if (!initialized) {
 *     return <div>Loading...</div>
 *   }
 *
 *   console.log('User authenticated:', isAuthenticated)
 *
 *   return children
 * }
 * ```
 *
 * 3. Loading State ile:
 * ```javascript
 * function App() {
 *   const { loading, initialized, isAuthenticated } = useAuthInit()
 *
 *   if (loading) {
 *     return (
 *       <div className="loading-screen">
 *         <Spin size="large" />
 *         <p>Checking authentication...</p>
 *       </div>
 *     )
 *   }
 *
 *   return (
 *     <Routes>
 *       {!isAuthenticated ? (
 *         <Route path="*" element={<Navigate to="/login" />} />
 *       ) : (
 *         <Route path="/" element={<Dashboard />} />
 *       )}
 *     </Routes>
 *   )
 * }
 * ```
 */

export default useAuthInit