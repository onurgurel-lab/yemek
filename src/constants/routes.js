/**
 * routes.js - Route Path Tanımları
 *
 * URL yollarını ve route yapılandırmasını içerir.
 * JSX içermez, pure JavaScript.
 *
 * @module constants/routes
 */

import React from 'react';

// ==================== ROUTE PATHS ====================

/**
 * ROUTES - URL Yolları
 * Navigation, redirect ve link işlemlerinde kullanılır.
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
    // Unauthorized
    UNAUTHORIZED: '/unauthorized',
};

// ==================== LAZY LOAD COMPONENTS ====================

// Yemekhane sayfaları - Lazy loading
export const MenuView = React.lazy(function() {
    return import('@/pages/Yemekhane/MenuView');
});

export const MenuManagement = React.lazy(function() {
    return import('@/pages/Yemekhane/MenuManagement');
});

export const ExcelUpload = React.lazy(function() {
    return import('@/pages/Yemekhane/ExcelUpload');
});

export const Reports = React.lazy(function() {
    return import('@/pages/Yemekhane/Reports');
});

// ==================== ROUTE CONFIG ====================

/**
 * Route yapılandırması
 * App.jsx'te kullanılır
 */
export const routeConfigData = [
    // Public
    {
        path: ROUTES.LOGIN,
        type: 'public',
        component: 'Login',
    },
    // Private
    {
        path: ROUTES.DASHBOARD,
        type: 'private',
        component: 'Dashboard',
    },
    {
        path: ROUTES.EXAMPLE,
        type: 'private',
        component: 'Example',
    },
    // Yemekhane - Private
    {
        path: ROUTES.YEMEKHANE,
        type: 'private',
        component: 'MenuView',
        lazy: true,
    },
    // Yemekhane - Admin Only
    {
        path: ROUTES.YEMEKHANE_MANAGEMENT,
        type: 'admin',
        component: 'MenuManagement',
        lazy: true,
    },
    {
        path: ROUTES.YEMEKHANE_EXCEL,
        type: 'admin',
        component: 'ExcelUpload',
        lazy: true,
    },
    {
        path: ROUTES.YEMEKHANE_REPORTS,
        type: 'admin',
        component: 'Reports',
        lazy: true,
    },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * getAdminRoutes - Admin route'larını döndürür
 */
export const getAdminRoutes = function() {
    return routeConfigData.filter(function(route) {
        return route.type === 'admin';
    });
};

/**
 * getPrivateRoutes - Private route'larını döndürür
 */
export const getPrivateRoutes = function() {
    return routeConfigData.filter(function(route) {
        return route.type === 'private';
    });
};

/**
 * getPublicRoutes - Public route'larını döndürür
 */
export const getPublicRoutes = function() {
    return routeConfigData.filter(function(route) {
        return route.type === 'public';
    });
};

export default ROUTES;