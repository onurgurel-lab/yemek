import { Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Example from '../pages/Example'
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
}

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
 * Yapı:
 * {
 *   path: string,              // URL yolu
 *   element: Component,        // Render edilecek component
 *   type: 'public'|'private'|'auth',  // Route tipi
 *   requiresAuth: boolean,     // Auth gerekliliği (opsiyonel)
 *   children: Array,           // Alt route'lar (opsiyonel)
 *   index: boolean,            // Index route mu? (opsiyonel)
 *   redirect: string           // Yönlendirme hedefi (opsiyonel)
 * }
 */
export const ROUTE_CONFIG = [
    // ==========================================
    // AUTH ROUTES - Sadece giriş yapmamış kullanıcılar için
    // ==========================================
    {
        path: ROUTES.LOGIN,
        element: Login,
        type: 'auth', // Giriş yapmışsa HOME'a yönlendir
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
        ],
    },
]

/**
 * PUBLIC_ROUTES - Herkese açık sayfalar
 *
 * Kimlik doğrulama gerektirmeyen route listesi.
 * Auth kontrolünden muaf tutulan sayfalar.
 *
 * Kullanım: Middleware'lerde veya route guard'larda kontrol için
 */
export const PUBLIC_ROUTES = [
    ROUTES.LOGIN,
]

/**
 * PRIVATE_ROUTES - Korumalı sayfalar
 *
 * Sadece giriş yapmış kullanıcıların erişebileceği route listesi.
 * Yetkisiz erişimde LOGIN sayfasına yönlendirilir.
 *
 * Kullanım: Middleware'lerde veya route guard'larda kontrol için
 */
export const PRIVATE_ROUTES = [
    ROUTES.DASHBOARD,
    ROUTES.EXAMPLE,
    ROUTES.PATIENT,
    '/patient/:id',
    ROUTES.TRANSFER,
    '/transfer/:id',
]