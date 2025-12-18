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
 */
export const hasRole = (user, role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
};

/**
 * Kullanıcının rotaya erişim yetkisi olup olmadığını kontrol eder
 */
export const canAccessRoute = (user, requiredRoles) => {
    if (!user || !user.roles || !Array.isArray(requiredRoles)) {
        return false;
    }
    return requiredRoles.some(role => user.roles.includes(role));
};

/**
 * Menüde gösterilecek rotaları filtreler
 */
export const getVisibleRoutes = (user) => {
    return yemekhaneRoutes.filter(route => {
        return route.showInMenu && canAccessRoute(user, route.roles);
    });
};