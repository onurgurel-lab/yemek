import axios from 'axios'
import { cookieUtils } from '@/utils/cookies'
import { ROUTES } from '@/constants/routes'

/**
 * setupAxiosInterceptors - Axios interceptor'larını yapılandır (Transfer Projesi)
 *
 * Request ve response interceptor'larını ekler.
 * Her API isteğinde authUser cookie'sini kontrol eder.
 * Cookie yoksa tüm verileri temizler ve login'e yönlendirir.
 *
 * Özellikler:
 * - Request interceptor: Her istekte cookie kontrolü
 * - Response interceptor: 401 hatalarında logout
 * - localStorage temizleme (cookie ile otomatik)
 * - Otomatik login redirect
 *
 * @param {Function} navigate - React Router navigate fonksiyonu
 * @param {Function} dispatch - Redux dispatch fonksiyonu (opsiyonel)
 */
export const setupAxiosInterceptors = (navigate, dispatch = null) => {
    // Request Interceptor
    axios.interceptors.request.use(
        (config) => {
            // authUser cookie'sini kontrol et
            const authCookie = cookieUtils.getAuthCookie()

            // Cookie yoksa veya geçersizse
            if (!authCookie || !authCookie.authToken) {
                // Login ve public endpoint'ler hariç tüm istekleri engelle
                const publicPaths = ['/login', '/register', '/forgot-password', '/auth/']
                const isPublicPath = publicPaths.some(path =>
                    config.url?.includes(path)
                )

                if (!isPublicPath) {
                    // Cookie'yi temizle (otomatik olarak localStorage da temizlenir)
                    cookieUtils.clearAuthCookie()

                    // Redux store'u temizle (dispatch varsa)
                    if (dispatch) {
                        dispatch({ type: 'auth/clearAuth' })
                    }

                    // Login sayfasına yönlendir
                    navigate(ROUTES.LOGIN, { replace: true })

                    // İsteği iptal et
                    return Promise.reject(new Error('No authentication cookie found'))
                }
            } else {
                // Cookie varsa token'ı header'a ekle
                config.headers.Authorization = `Bearer ${authCookie.authToken}`
            }

            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    // Response Interceptor
    axios.interceptors.response.use(
        (response) => {
            return response
        },
        (error) => {
            // 401 Unauthorized hatası
            if (error.response && error.response.status === 401) {
                // Cookie'yi temizle (otomatik olarak localStorage da temizlenir)
                cookieUtils.clearAuthCookie()

                // Redux store'u temizle (dispatch varsa)
                if (dispatch) {
                    dispatch({ type: 'auth/clearAuth' })
                }

                // Login sayfasına yönlendir
                navigate(ROUTES.LOGIN, { replace: true })
            }

            return Promise.reject(error)
        }
    )
}

/**
 * Kullanım Örneği (App.jsx içinde):
 *
 * ```javascript
 * import { useEffect } from 'react'
 * import { useNavigate } from 'react-router-dom'
 * import { useDispatch } from 'react-redux'
 * import { setupAxiosInterceptors } from '@/utils/axiosInterceptor'
 *
 * function App() {
 *   const navigate = useNavigate()
 *   const dispatch = useDispatch()
 *
 *   useEffect(() => {
 *     // Axios interceptor'ları kur
 *     setupAxiosInterceptors(navigate, dispatch)
 *   }, [navigate, dispatch])
 *
 *   return (
 *     <Routes>
 *       <Route path="/login" element={<Login />} />
 *       <Route path="/" element={<ProtectedLayout />}>
 *         <Route index element={<Dashboard />} />
 *       </Route>
 *     </Routes>
 *   )
 * }
 * ```
 *
 * Önemli Notlar:
 * - Her API isteğinde otomatik cookie kontrolü yapılır
 * - Cookie yoksa istek engellenir ve login'e yönlendirilir
 * - 401 hatalarında otomatik logout yapılır
 * - Cookie temizlendiğinde localStorage da otomatik temizlenir
 * - Public endpoint'ler (login, register) kontrolden muaftır
 */