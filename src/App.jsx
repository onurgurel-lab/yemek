/**
 * App.jsx - Ana Uygulama Component'i
 *
 * Route yapılandırmasını kullanarak sayfaları render eder.
 * Güncelleme: /yemekhane (Menü Görüntüle) route'u kaldırıldı - Dashboard'da gösteriliyor
 *
 * @module App
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, Spin } from 'antd';
import trTR from 'antd/locale/tr_TR';

import { store } from '@/store';
import { useAuthInit } from '@/hooks/useAuthInit';
import { ROUTES } from '@/constants/routes';

// Layout
import MainLayout from '@/layouts/MainLayout';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Example from '@/pages/Example';

// Protected Routes
import {
    PrivateRoute,
    AdminRoute,
    PublicRoute,
    PageLoading,
    UnauthorizedPage
} from '@/components/ProtectedRoute';

// Yemekhane Pages - Lazy Loading (MenuView kaldırıldı - Dashboard'da gösteriliyor)
const MenuManagement = React.lazy(() => import('@/pages/Yemekhane/MenuManagement'));
const ExcelUpload = React.lazy(() => import('@/pages/Yemekhane/ExcelUpload'));
const Reports = React.lazy(() => import('@/pages/Yemekhane/Reports'));

/**
 * AppLoading - Uygulama başlatılırken gösterilecek loading
 */
const AppLoading = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>Uygulama başlatılıyor...</span>
    </div>
);

/**
 * AppContent - Auth initialization ile routes
 */
const AppContent = () => {
    // Auth durumunu başlat (cookie kontrolü)
    const { initialized } = useAuthInit();

    // Auth başlatılana kadar loading göster
    if (!initialized) {
        return <AppLoading />;
    }

    return (
        <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route
                path={ROUTES.LOGIN}
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            {/* ==================== PRIVATE ROUTES ==================== */}

            {/* Dashboard - Menü görüntüleme artık burada */}
            <Route
                path={ROUTES.DASHBOARD}
                element={
                    <PrivateRoute>
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </PrivateRoute>
                }
            />

            {/* Example */}
            <Route
                path={ROUTES.EXAMPLE}
                element={
                    <PrivateRoute>
                        <MainLayout>
                            <Example />
                        </MainLayout>
                    </PrivateRoute>
                }
            />

            {/* ==================== YEMEKHANE ADMIN ROUTES ==================== */}
            {/* Not: /yemekhane (Menü Görüntüle) kaldırıldı - Dashboard'da gösteriliyor */}

            {/* Menü Yönetimi - SADECE Admin/RaporAdmin */}
            <Route
                path={ROUTES.YEMEKHANE_MANAGEMENT}
                element={
                    <AdminRoute>
                        <MainLayout>
                            <Suspense fallback={<PageLoading />}>
                                <MenuManagement />
                            </Suspense>
                        </MainLayout>
                    </AdminRoute>
                }
            />

            {/* Excel Yükle - SADECE Admin/RaporAdmin */}
            <Route
                path={ROUTES.YEMEKHANE_EXCEL}
                element={
                    <AdminRoute>
                        <MainLayout>
                            <Suspense fallback={<PageLoading />}>
                                <ExcelUpload />
                            </Suspense>
                        </MainLayout>
                    </AdminRoute>
                }
            />

            {/* Raporlar - SADECE Admin/RaporAdmin */}
            <Route
                path={ROUTES.YEMEKHANE_REPORTS}
                element={
                    <AdminRoute>
                        <MainLayout>
                            <Suspense fallback={<PageLoading />}>
                                <Reports />
                            </Suspense>
                        </MainLayout>
                    </AdminRoute>
                }
            />

            {/* ==================== OTHER ROUTES ==================== */}

            {/* Unauthorized */}
            <Route
                path={ROUTES.UNAUTHORIZED}
                element={<UnauthorizedPage />}
            />

            {/* Root - Dashboard'a yönlendir */}
            <Route
                path="/"
                element={<Navigate to={ROUTES.DASHBOARD} replace />}
            />

            {/* Eski /yemekhane URL'sine girenler Dashboard'a yönlendirilsin */}
            <Route
                path="/yemekhane"
                element={<Navigate to={ROUTES.DASHBOARD} replace />}
            />

            {/* 404 - Dashboard'a yönlendir */}
            <Route
                path="*"
                element={<Navigate to={ROUTES.DASHBOARD} replace />}
            />
        </Routes>
    );
};

/**
 * App - Ana uygulama wrapper'ı
 */
const App = () => {
    return (
        <Provider store={store}>
            <ConfigProvider locale={trTR}>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </ConfigProvider>
        </Provider>
    );
};

export default App;