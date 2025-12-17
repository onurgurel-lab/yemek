import React from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Example from '@/pages/Example';

// Yemekhane sayfaları - Lazy loading
const MenuView = React.lazy(() => import('@/pages/Yemekhane/MenuView'));
const MenuManagement = React.lazy(() => import('@/pages/Yemekhane/MenuManagement'));
const ExcelUpload = React.lazy(() => import('@/pages/Yemekhane/ExcelUpload'));
const Reports = React.lazy(() => import('@/pages/Yemekhane/Reports'));

/**
 * ROUTE PATHS - URL Yolları
 *
 * Tüm route path'lerini içeren merkezi obje.
 * Navigation, redirect ve link işlemlerinde kullanılır.
 *
 * Kullanım:
 * - navigate(ROUTES.DASHBOARD)
 * - <Link to={ROUTES.LOGIN}>
 * - <Navigate to={ROUTES.EXAMPLE} />
 */
export const ROUTES = {
    DASHBOARD: '/dashboard',
    LOGIN: '/login',
    EXAMPLE: '/example',
    TRANSFER: '/transfer',
    // Yemekhane Routes
    YEMEKHANE: '/yemekhane',
    YEMEKHANE_MANAGEMENT: '/yemekhane/yonetim',
    YEMEKHANE_EXCEL: '/yemekhane/excel-yukle',
    YEMEKHANE_REPORTS: '/yemekhane/raporlar',
};

/**
 * ROUTE CONFIGURATIONS - Route Tanımları ve Elementleri
 *
 * Her route için gerekli tüm bilgileri içeren merkezi yapılandırma.
 * App.jsx bu yapılandırmayı okuyarak otomatik route oluşturur.
 *
 * Route Türleri:
 * - public: Herkese açık, kimlik doğrulama gerektirmeyen
 * - private: Giriş yapmış kullanıcılara özel (token gerektirir)
 * - auth: Sadece giriş yapmamış kullanıcılara açık (login, register vb.)
 *
 * NOT: Lazy loaded component'ler için Suspense wrapper'ı App.jsx'te uygulanır
 */
export const ROUTE_CONFIG = [
    // ==========================================
    // AUTH ROUTES - Sadece giriş yapmamış kullanıcılar için
    // ==========================================
    {
        path: ROUTES.LOGIN,
        element: Login,
        type: 'auth',
        requiresAuth: false,
    },

    // ==========================================
    // PRIVATE ROUTES - Layout içinde, giriş gerektirir
    // ==========================================
    {
        path: '/',
        element: MainLayout,
        type: 'private',
        requiresAuth: true,
        children: [
            // Ana route'a yönlendirme
            {
                index: true,
                redirect: ROUTES.DASHBOARD,
            },
            // Ana sayfa (Dashboard)
            {
                path: ROUTES.DASHBOARD,
                element: Dashboard,
                type: 'private',
                requiresAuth: true,
            },
            // Örnek sayfa
            {
                path: ROUTES.EXAMPLE,
                element: Example,
                type: 'private',
                requiresAuth: true,
            },
            // ==========================================
            // YEMEKHANE ROUTES - Lazy loaded
            // ==========================================
            {
                path: ROUTES.YEMEKHANE,
                element: MenuView,
                type: 'private',
                requiresAuth: true,
                lazy: true,
            },
            {
                path: ROUTES.YEMEKHANE_MANAGEMENT,
                element: MenuManagement,
                type: 'private',
                requiresAuth: true,
                lazy: true,
            },
            {
                path: ROUTES.YEMEKHANE_EXCEL,
                element: ExcelUpload,
                type: 'private',
                requiresAuth: true,
                lazy: true,
            },
            {
                path: ROUTES.YEMEKHANE_REPORTS,
                element: Reports,
                type: 'private',
                requiresAuth: true,
                lazy: true,
            },
        ],
    },
];

/**
 * PUBLIC_ROUTES - Herkese açık sayfalar
 */
export const PUBLIC_ROUTES = [ROUTES.LOGIN];

/**
 * PRIVATE_ROUTES - Giriş gerektiren sayfalar
 */
export const PRIVATE_ROUTES = [
    ROUTES.DASHBOARD,
    ROUTES.EXAMPLE,
    ROUTES.YEMEKHANE,
    ROUTES.YEMEKHANE_MANAGEMENT,
    ROUTES.YEMEKHANE_EXCEL,
    ROUTES.YEMEKHANE_REPORTS,
];

export default ROUTES;