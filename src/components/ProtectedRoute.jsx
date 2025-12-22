/**
 * ProtectedRoute.jsx - Route Koruma Komponentleri
 *
 * ✅ FIX v3: Sayfa yenilemede login'e yönlendirme sorunu çözüldü
 * - Cookie/localStorage'dan direkt auth kontrolü
 * - initialized beklemeden önce token kontrolü
 *
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ROUTES } from '@/constants/routes';
import { STORAGE_KEYS } from '@/constants/config';

// ==================== INLINE TOKEN CHECK ====================

/**
 * hasValidToken - Cookie veya localStorage'da geçerli token var mı
 * Redux state'inden bağımsız kontrol
 */
const hasValidToken = () => {
    try {
        // 1. Cookie kontrolü
        const cookieString = document.cookie;
        if (cookieString && cookieString.includes('authUser=')) {
            const cookies = cookieString.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith('authUser=')) {
                    const encodedValue = cookie.substring(9);
                    if (encodedValue) {
                        const decodedValue = decodeURIComponent(encodedValue);
                        const parsed = JSON.parse(decodedValue);
                        if (parsed.authToken) {
                            return true;
                        }
                    }
                }
            }
        }

        // 2. localStorage kontrolü
        const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (localToken) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Token check error:', error);
        return false;
    }
};

// ==================== LOADING COMPONENTS ====================

/**
 * PageLoading - Sayfa yüklenirken gösterilecek spinner
 */
export const PageLoading = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>Yükleniyor...</span>
    </div>
);

/**
 * FullPageLoading - Tam sayfa loading
 */
export const FullPageLoading = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>Yetki kontrol ediliyor...</span>
    </div>
);

/**
 * UnauthorizedResult - Yetkisiz erişim uyarısı
 */
const UnauthorizedResult = ({
                                title = 'Yetkisiz Erişim',
                                subTitle = 'Bu sayfaya erişim yetkiniz bulunmamaktadır.',
                                requiredRole = 'Admin'
                            }) => {
    const navigate = useNavigate();

    return (
        <Result
            status="403"
            title={title}
            subTitle={
                <div>
                    <p>{subTitle}</p>
                    <p style={{ color: '#ff4d4f', fontWeight: 500 }}>
                        Gerekli yetki: {requiredRole}
                    </p>
                </div>
            }
            extra={[
                <Button
                    type="primary"
                    key="dashboard"
                    onClick={() => navigate(ROUTES.DASHBOARD || '/dashboard')}
                >
                    Dashboard'a Dön
                </Button>,
                <Button
                    key="back"
                    onClick={() => navigate(-1)}
                >
                    Geri Git
                </Button>
            ]}
        />
    );
};

// ==================== ROUTE COMPONENTS ====================

/**
 * PrivateRoute - Sadece giriş yapmış kullanıcılar erişebilir
 *
 * ✅ FIX: Önce token varlığını kontrol et, sonra Redux state'e bak
 */
export const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

    // ✅ FIX: Redux state henüz hazır değilse, direkt token kontrolü yap
    const tokenExists = hasValidToken();

    // Durum 1: Redux initialized değil ama token var → loading göster (kısa süre)
    if (!initialized && tokenExists) {
        return <FullPageLoading />;
    }

    // Durum 2: Redux initialized değil ve token yok → login'e git
    if (!initialized && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Durum 3: Redux initialized ve loading → loading göster
    if (initialized && loading) {
        return <FullPageLoading />;
    }

    // Durum 4: Redux initialized, authenticated değil ve token yok → login'e git
    if (!isAuthenticated && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Durum 5: Token var (Redux veya cookie/localStorage) → children göster
    return children;
};

/**
 * AdminRoute - SADECE Admin kullanıcılar erişebilir
 */
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { isAdmin } = useUserRoles();
    const tokenExists = hasValidToken();

    // Token yoksa veya initialized değilse
    if (!initialized && tokenExists) {
        return <FullPageLoading />;
    }

    if (!initialized && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (initialized && loading) {
        return <FullPageLoading />;
    }

    if (!isAuthenticated && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Admin değilse yetkisiz erişim
    if (!isAdmin) {
        return (
            <UnauthorizedResult
                title="Yetkisiz Erişim"
                subTitle="Bu sayfaya erişim yetkiniz bulunmamaktadır."
                requiredRole="Admin"
            />
        );
    }

    return children;
};

/**
 * ReportsRoute - Admin VEYA RaporAdmin kullanıcılar erişebilir
 */
export const ReportsRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { canViewReports } = useUserRoles();
    const tokenExists = hasValidToken();

    if (!initialized && tokenExists) {
        return <FullPageLoading />;
    }

    if (!initialized && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (initialized && loading) {
        return <FullPageLoading />;
    }

    if (!isAuthenticated && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!canViewReports) {
        return (
            <UnauthorizedResult
                title="Yetkisiz Erişim"
                subTitle="Raporlar sayfasına erişim yetkiniz bulunmamaktadır."
                requiredRole="Admin veya RaporAdmin"
            />
        );
    }

    return children;
};

/**
 * PublicRoute - Sadece giriş yapmamış kullanıcılar erişebilir (Login sayfası)
 *
 * ✅ FIX: Token varsa dashboard'a yönlendir
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const tokenExists = hasValidToken();

    // Token varsa (giriş yapılmış) dashboard'a yönlendir
    if (tokenExists || isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // Loading durumunda bekle
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    return children;
};

/**
 * RoleBasedRoute - Dinamik rol kontrolü
 */
export const RoleBasedRoute = ({
                                   children,
                                   allowedRoles = [],
                                   requiredRoleDescription = 'Gerekli yetki'
                               }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { hasAnyRole } = useUserRoles();
    const tokenExists = hasValidToken();

    if (!initialized && tokenExists) {
        return <FullPageLoading />;
    }

    if (!initialized && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (initialized && loading) {
        return <FullPageLoading />;
    }

    if (!isAuthenticated && !tokenExists) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!hasAnyRole(allowedRoles)) {
        return (
            <UnauthorizedResult
                title="Yetkisiz Erişim"
                subTitle="Bu sayfaya erişim yetkiniz bulunmamaktadır."
                requiredRole={requiredRoleDescription}
            />
        );
    }

    return children;
};

// ==================== DEFAULT EXPORT ====================

export default {
    PrivateRoute,
    AdminRoute,
    ReportsRoute,
    PublicRoute,
    RoleBasedRoute,
    PageLoading,
    FullPageLoading,
};