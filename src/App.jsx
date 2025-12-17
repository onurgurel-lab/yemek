import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Spin } from 'antd'
import { ROUTE_CONFIG, ROUTES } from './constants/routes'
import { validateAndLoadUser, checkTokenExpiry } from './store/slices/authSlice'
import { setupAxiosInterceptors } from './utils/axiosInterceptor'

/**
 * Route Builder Helper
 *
 * Route yapılandırmasından React Router Route componentleri oluşturur.
 * Auth kontrolü ve yönlendirmeleri otomatik olarak yönetir.
 *
 * @param {Object} config - Route yapılandırma objesi
 * @param {boolean} isAuthenticated - Kullanıcının giriş durumu
 * @returns {JSX.Element} Route component
 */
const buildRoute = (config, isAuthenticated) => {
    const { path, element: Element, type, children, index, redirect } = config

    // Index route için redirect kontrolü
    if (index && redirect) {
        return <Route key="index" index element={<Navigate to={redirect} replace />} />
    }

    // Element render mantığı
    let routeElement

    if (type === 'auth') {
        // Auth route: Giriş yapmışsa HOME'a yönlendir, değilse sayfayı göster
        routeElement = !isAuthenticated ? <Element /> : <Navigate to={ROUTES.DASHBOARD} replace />
    } else if (type === 'private') {
        // Private route: Giriş yapmamışsa LOGIN'e yönlendir, değilse sayfayı göster
        routeElement = isAuthenticated ? <Element /> : <Navigate to={ROUTES.LOGIN} replace />
    } else {
        // Public route: Direkt göster
        routeElement = <Element />
    }

    return (
        <Route key={path || 'index'} path={path} index={index} element={routeElement}>
            {/* Alt route'ları recursive olarak oluştur */}
            {children?.map((child) => buildRoute(child, isAuthenticated))}
        </Route>
    )
}

/**
 * AppContent - Router içindeki ana içerik
 *
 * Router hook'larını kullanabilmek için ayrı component.
 * Authentication kontrolü, token validation ve route rendering işlemlerini yönetir.
 */
function AppContent() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth)

    useEffect(() => {
        // Axios interceptor'ları kur (401/403 hatalarını yakala)
        setupAxiosInterceptors(navigate, dispatch)

        // Uygulama başladığında cookie'deki token'ı validate et
        dispatch(validateAndLoadUser())

        // Token süresini kontrol et
        dispatch(checkTokenExpiry())

        // Her 5 dakikada bir token süresini kontrol et
        const tokenCheckInterval = setInterval(() => {
            dispatch(checkTokenExpiry())
        }, 5 * 60 * 1000) // 5 dakika

        // Cleanup: interval'i temizle
        return () => clearInterval(tokenCheckInterval)
    }, [dispatch, navigate])

    // İlk yükleme devam ediyorsa loading göster
    if (!initialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen flex-col gap-4">
                <Spin size="large" />
                <p className="text-gray-600">Yükleniyor...</p>
            </div>
        )
    }

    // Route'ları dinamik olarak oluştur
    return (
        <Routes>
            {ROUTE_CONFIG.map((config) => buildRoute(config, isAuthenticated))}
        </Routes>
    )
}

/**
 * App - Ana uygulama bileşeni
 *
 * BrowserRouter ile uygulamayı sarar ve routing'i başlatır.
 * Tüm route tanımları ROUTE_CONFIG'ten otomatik olarak okunur.
 */
function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}

export default App