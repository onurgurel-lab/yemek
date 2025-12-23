/**
 * App.jsx - Ana Uygulama Componenti
 *
 * ✅ FIX: 401 Unauthorized → Login Redirect
 * - setNavigate ile axiosInstance'a navigate fonksiyonu bağlanıyor
 * - Herhangi bir API 401 döndüğünde otomatik login'e yönlendirilir
 *
 * ROL BAZLI ROUTE KORUMASI:
 * - /yemekhane/yonetim → AdminRoute (SADECE Admin)
 * - /yemekhane/excel-yukle → AdminRoute (SADECE Admin)
 * - /yemekhane/raporlar → ReportsRoute (Admin VEYA RaporAdmin)
 * - /dashboard → PrivateRoute (tüm giriş yapmış kullanıcılar)
 *
 * @module App
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';

// Store
import { store } from '@/store';

// Utils - setNavigate import
import { setNavigate } from '@/utils/axiosInstance';

// Components
import MainLayout from '@/layouts/MainLayout';
import {
    PrivateRoute,
    AdminRoute,
    ReportsRoute,
    PublicRoute,
    PageLoading,
} from '@/components/ProtectedRoute';

// Constants
import { ROUTES } from '@/constants/routes';

// Auth Actions
import { validateAndLoadUser } from '@/store/slices/authSlice';

// ==================== LAZY LOAD PAGES ====================

const Login = React.lazy(() => import('@/pages/Login'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const MenuManagement = React.lazy(() => import('@/pages/Yemekhane/MenuManagement'));
const ExcelUpload = React.lazy(() => import('@/pages/Yemekhane/ExcelUpload'));
const Reports = React.lazy(() => import('@/pages/Yemekhane/Reports'));

// ==================== UNAUTHORIZED PAGE ====================

const UnauthorizedPage = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <h1 style={{ color: '#ff4d4f' }}>403 - Yetkisiz Erişim</h1>
        <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        <a href={ROUTES.DASHBOARD}>Dashboard'a Dön</a>
    </div>
);

// ==================== APP CONTENT ====================

/**
 * AppContent - Route yapısını içeren ana component
 *
 * ✅ useNavigate burada kullanılıyor (BrowserRouter içinde)
 * ✅ setNavigate ile axiosInstance'a navigate fonksiyonu veriliyor
 */
const AppContent = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ✅ Axios interceptor'a navigate fonksiyonunu ver
    // Bu sayede 401 hatalarında React Router ile yönlendirme yapılır
    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);

    // Uygulama başladığında auth durumunu kontrol et
    useEffect(() => {
        dispatch(validateAndLoadUser());
    }, [dispatch]);

    return (
        <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}

            {/* Login */}
            <Route
                path={ROUTES.LOGIN}
                element={
                    <PublicRoute>
                        <Suspense fallback={<PageLoading />}>
                            <Login />
                        </Suspense>
                    </PublicRoute>
                }
            />

            {/* ==================== PRIVATE ROUTES ==================== */}

            {/* Dashboard - Tüm giriş yapmış kullanıcılar */}
            <Route
                path={ROUTES.DASHBOARD}
                element={
                    <PrivateRoute>
                        <MainLayout>
                            <Suspense fallback={<PageLoading />}>
                                <Dashboard />
                            </Suspense>
                        </MainLayout>
                    </PrivateRoute>
                }
            />

            {/* ==================== ADMIN ONLY ROUTES ==================== */}

            {/*
                Menü Yönetimi - SADECE Admin
                RaporAdmin bu sayfaya erişemez!
            */}
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

            {/*
                Excel Yükle - SADECE Admin
                RaporAdmin bu sayfaya erişemez!
            */}
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

            {/* ==================== REPORTS ROUTE ==================== */}

            {/*
                Raporlar - Admin VEYA RaporAdmin
                Her iki rol de bu sayfaya erişebilir
            */}
            <Route
                path={ROUTES.YEMEKHANE_REPORTS}
                element={
                    <ReportsRoute>
                        <MainLayout>
                            <Suspense fallback={<PageLoading />}>
                                <Reports />
                            </Suspense>
                        </MainLayout>
                    </ReportsRoute>
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

// ==================== APP ====================

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