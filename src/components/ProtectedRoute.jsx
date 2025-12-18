/**
 * ProtectedRoute.jsx - Route Koruma Komponentleri
 *
 * PrivateRoute, AdminRoute ve PublicRoute komponentlerini içerir.
 *
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
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
 * PrivateRoute - Sadece giriş yapmış kullanıcılar erişebilir
 */
export const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

    // Auth henüz başlatılmadıysa loading göster
    if (!initialized || loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return children;
};

/**
 * AdminRoute - Sadece Admin veya RaporAdmin kullanıcılar erişebilir
 */
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
    const { canManageMenu } = useUserRoles();

    // Auth henüz başlatılmadıysa loading göster
    if (!initialized || loading) {
        return <FullPageLoading />;
    }

    // Giriş yapılmamışsa login'e yönlendir
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Admin/RaporAdmin değilse yetkisiz erişim sayfası göster
    if (!canManageMenu) {
        return (
            <Result
                status="403"
                title="Yetkisiz Erişim"
                subTitle="Bu sayfaya erişim yetkiniz bulunmamaktadır. Admin veya RaporAdmin yetkisi gereklidir."
                extra={[
                    <Button
                        type="primary"
                        key="home"
                        onClick={() => window.location.href = ROUTES.DASHBOARD}
                    >
                        Ana Sayfaya Dön
                    </Button>,
                    <Button
                        key="back"
                        onClick={() => window.history.back()}
                    >
                        Geri Dön
                    </Button>
                ]}
            />
        );
    }

    return children;
};

/**
 * PublicRoute - Giriş yapmamış kullanıcılar için (login sayfası)
 * Giriş yapmışsa dashboard'a yönlendir
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, initialized } = useSelector((state) => state.auth);

    // Auth henüz başlatılmadıysa children'ı göster
    if (!initialized) {
        return children;
    }

    // Giriş yapmışsa dashboard'a yönlendir
    if (isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return children;
};

/**
 * UnauthorizedPage - Yetkisiz erişim sayfası
 */
export const UnauthorizedPage = () => (
    <Result
        status="403"
        title="Yetkisiz Erişim"
        subTitle="Bu sayfaya erişim yetkiniz bulunmamaktadır."
        extra={
            <Button
                type="primary"
                onClick={() => window.location.href = ROUTES.DASHBOARD}
            >
                Ana Sayfaya Dön
            </Button>
        }
    />
);

export default {
    PrivateRoute,
    AdminRoute,
    PublicRoute,
    PageLoading,
    FullPageLoading,
    UnauthorizedPage,
};