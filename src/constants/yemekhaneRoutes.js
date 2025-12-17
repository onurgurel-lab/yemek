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
    return requiredRoles.some((role) => user.roles.includes(role));
};

/**
 * Kullanıcının menü yönetimi yetkisi olup olmadığını kontrol eder
 */
export const canManageMenu = (user) => {
    return hasRole(user, ADMIN) || hasRole(user, YEMEKHANE_ADMIN);
};

/**
 * Kullanıcının yemekhane admini olup olmadığını kontrol eder
 */
export const isYemekhaneAdmin = (user) => {
    return hasRole(user, YEMEKHANE_ADMIN);
};

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 */
export const isAdmin = (user) => {
    return hasRole(user, ADMIN);
};

// ==================== ROUTE YARDIMCI FONKSİYONLARI ====================

/**
 * Kullanıcının erişebileceği rotaları döndürür
 */
export const getAccessibleRoutes = (user) => {
    if (!user) return [];
    return yemekhaneRoutes.filter((route) => canAccessRoute(user, route.roles));
};

/**
 * Menüde gösterilecek rotaları döndürür
 */
export const getMenuRoutes = (user) => {
    return getAccessibleRoutes(user).filter((route) => route.showInMenu);
};

/**
 * Belirtilen path için breadcrumb verisini döndürür
 */
export const getBreadcrumbs = (path) => {
    return yemekhaneBreadcrumbs[path] || [];
};

/**
 * Belirtilen path için sayfa başlığını döndürür
 */
export const getPageTitle = (path) => {
    const route = yemekhaneRoutes.find((r) => r.path === path);
    return route ? route.title : 'Yemekhane';
};

/**
 * React Router için route config oluşturur
 */
export const createRouteConfig = () => {
    return yemekhaneRoutes.map((route) => ({
        path: route.path,
        element: route.element,
        exact: route.exact,
    }));
};

/**
 * Ana yemekhane rotasını döndürür
 */
export const getDefaultRoute = () => '/yemekhane';

/**
 * Kullanıcının ilk erişebileceği rotayı döndürür
 */
export const getFirstAccessibleRoute = (user) => {
    const routes = getAccessibleRoutes(user);
    return routes.length > 0 ? routes[0].path : null;
};

// ==================== NAVİGASYON YARDIMCILARI ====================

/**
 * Yemekhane alt sayfalarının listesi
 */
export const yemekhaneSubPages = {
    MENU_VIEW: '/yemekhane',
    MENU_MANAGEMENT: '/yemekhane/yonetim',
    EXCEL_UPLOAD: '/yemekhane/excel-yukle',
    REPORTS: '/yemekhane/raporlar',
};

/**
 * Path'in yemekhane modülüne ait olup olmadığını kontrol eder
 */
export const isYemekhanePath = (path) => {
    return path && path.startsWith('/yemekhane');
};

/**
 * Route için ikon adı döndürür (Ant Design Icon adları)
 */
export const getRouteIcon = (path) => {
    const iconMap = {
        '/yemekhane': 'CalendarOutlined',
        '/yemekhane/yonetim': 'EditOutlined',
        '/yemekhane/excel-yukle': 'UploadOutlined',
        '/yemekhane/raporlar': 'BarChartOutlined',
    };
    return iconMap[path] || 'AppstoreOutlined';
};

export default yemekhaneRoutes;