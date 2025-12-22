/**
 * ProtectedRoute.jsx - Route Koruma Komponentleri
 *
 * ROL BAZLI ERİŞİM KONTROLÜ:
 * - AdminRoute: Menü Yönetimi, Excel Yükle (SADECE Admin)
 * - ReportsRoute: Raporlar (Admin VEYA RaporAdmin)
 * - PrivateRoute: Tüm giriş yapmış kullanıcılar
 *
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ROUTES } from '@/constants/routes';

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

/**
 * PrivateRoute - Sadece giriş yapmış kullanıcılar erişebilir
 */
export const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

    // Sadece ilk yükleme sırasında loading göster
    // initialized false VE loading true ise bekle
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    // initialized true olduğunda (logout sonrası dahil) direkt yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return children;
};

/**
 * AdminRoute - SADECE Admin kullanıcılar erişebilir
 * Menü Yönetimi ve Excel Yükle sayfaları için kullanılır
 */
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { isAdmin } = useUserRoles();

    // Sadece ilk yükleme sırasında loading göster
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Admin değilse yetkisiz erişim uyarısı göster
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
 * Sadece Raporlar sayfası için kullanılır
 */
export const ReportsRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { canViewReports } = useUserRoles();

    // Sadece ilk yükleme sırasında loading göster
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Rapor görüntüleme yetkisi yoksa uyarı göster
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
 * PublicRoute - Sadece giriş yapmamış kullanıcılar erişebilir
 * Login sayfası için kullanılır
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

    // Sadece ilk yükleme sırasında loading göster
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    // Zaten giriş yapmışsa dashboard'a yönlendir
    if (isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return children;
};

/**
 * RoleBasedRoute - Dinamik rol kontrolü için genel component
 */
export const RoleBasedRoute = ({
                                   children,
                                   allowedRoles = [],
                                   requiredRoleDescription = 'Gerekli yetki'
                               }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { hasAnyRole } = useUserRoles();

    // Sadece ilk yükleme sırasında loading göster
    if (!initialized && loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Gerekli rollerden hiçbirine sahip değilse uyarı göster
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

export default {
    PrivateRoute,
    AdminRoute,
    ReportsRoute,
    PublicRoute,
    RoleBasedRoute,
    PageLoading,
    FullPageLoading,
};