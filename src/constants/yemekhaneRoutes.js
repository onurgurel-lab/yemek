/**
 * Yemekhane Route Tanımlamaları
 * Sayfa yönlendirme ve erişim kontrolleri
 */

import React from 'react';
import { YEMEKHANE_ROLES } from '@/constants/mealMenuApi';

const { USER, ADMIN, YEMEKHANE_ADMIN } = YEMEKHANE_ROLES;

// ==================== LAZY LOAD COMPONENTS ====================

const MenuView = React.lazy(() => import('@/pages/Yemekhane/MenuView'));
const MenuManagement = React.lazy(() => import('@/pages/Yemekhane/MenuManagement'));
const ExcelUpload = React.lazy(() => import('@/pages/Yemekhane/ExcelUpload'));
const Reports = React.lazy(() => import('@/pages/Yemekhane/Reports'));

// ==================== ROUTE TANIMLARI ====================

export const yemekhaneRoutes = [
    {
        path: '/yemekhane',
        element: MenuView,
        title: 'Yemek Menüsü',
        icon: 'calendar',
        roles: [USER, YEMEKHANE_ADMIN, ADMIN],
        showInMenu: true,
        exact: true,
    },
    {
        path: '/yemekhane/yonetim',
        element: MenuManagement,
        title: 'Menü Yönetimi',
        icon: 'edit',
        roles: [YEMEKHANE_ADMIN, ADMIN],
        showInMenu: true,
        exact: true,
    },
    {
        path: '/yemekhane/excel-yukle',
        element: ExcelUpload,
        title: 'Excel Yükle',
        icon: 'upload',
        roles: [YEMEKHANE_ADMIN, ADMIN],
        showInMenu: true,
        exact: true,
    },
    {
        path: '/yemekhane/raporlar',
        element: Reports,
        title: 'Raporlar',
        icon: 'bar-chart',
        roles: [YEMEKHANE_ADMIN, ADMIN],
        showInMenu: true,
        exact: true,
    },
];

// ==================== BREADCRUMB TANIMLARI ====================

export const yemekhaneBreadcrumbs = {
    '/yemekhane': [{ title: 'Yemekhane', path: '/yemekhane' }],
    '/yemekhane/yonetim': [
        { title: 'Yemekhane', path: '/yemekhane' },
        { title: 'Menü Yönetimi', path: '/yemekhane/yonetim' },
    ],
    '/yemekhane/excel-yukle': [
        { title: 'Yemekhane', path: '/yemekhane' },
        { title: 'Excel Yükle', path: '/yemekhane/excel-yukle' },
    ],
    '/yemekhane/raporlar': [
        { title: 'Yemekhane', path: '/yemekhane' },
        { title: 'Raporlar', path: '/yemekhane/raporlar' },
    ],
};

// ==================== ERİŞİM KONTROL FONKSİYONLARI ====================

/**
 * Kullanıcının belirtilen role sahip olup olmadığını kontrol eder
 * @param {Object} user - Kullanıcı objesi
 * @param {string} role - Kontrol edilecek rol
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
};

/**
 * Kullanıcının rotaya erişim yetkisi olup olmadığını kontrol eder
 * @param {Object} user - Kullanıcı objesi
 * @param {Array} requiredRoles - Gerekli roller
 * @returns {boolean}
 */
export const canAccessRoute = (user, requiredRoles) => {
    if (!user || !user.roles || !Array.isArray(requiredRoles)) {
        return false;
    }
    return requiredRoles.some(role => user.roles.includes(role));
};

/**
 * Kullanıcının menü yönetimi yetkisi olup olmadığını kontrol eder
 * Admin veya YemekhaneAdmin rolüne sahip kullanıcılar menü yönetebilir
 * @param {Object} user - Kullanıcı objesi
 * @returns {boolean}
 */
export const canManageMenu = (user) => {
    if (!user) return false;

    // Roller array içinde mi kontrol et
    if (user.roles && Array.isArray(user.roles)) {
        return user.roles.includes(ADMIN) || user.roles.includes(YEMEKHANE_ADMIN);
    }

    // Tek rol string olarak gelebilir
    if (user.role) {
        return user.role === ADMIN || user.role === YEMEKHANE_ADMIN;
    }

    return false;
};

/**
 * Menüde gösterilecek rotaları filtreler
 * @param {Object} user - Kullanıcı objesi
 * @returns {Array} Kullanıcının görebileceği rotalar
 */
export const getVisibleRoutes = (user) => {
    return yemekhaneRoutes.filter(route => {
        return route.showInMenu && canAccessRoute(user, route.roles);
    });
};

/**
 * Kullanıcının belirtilen rotaya erişip erişemeyeceğini kontrol eder
 * @param {Object} user - Kullanıcı objesi
 * @param {string} path - Rota yolu
 * @returns {boolean}
 */
export const canAccessPath = (user, path) => {
    const route = yemekhaneRoutes.find(r => r.path === path);
    if (!route) return false;
    return canAccessRoute(user, route.roles);
};