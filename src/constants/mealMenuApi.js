/**
 * Yemekhane API Sabitleri ve Yardımcı Fonksiyonlar
 */

// API Endpoint Tanımları
export const YEMEKHANE_ENDPOINTS = {
    // Menu İşlemleri
    MENU: {
        GET_ALL: '/api/mealmenu',
        GET_BY_ID: '/api/mealmenu',
        GET_BY_DATE: '/api/mealmenu',
        GET_BY_MONTH: '/api/mealmenu',
        GET_BY_DATE_RANGE: '/api/mealmenu',
        CREATE: '/api/mealmenu',
        UPDATE: '/api/mealmenu',
        DELETE: '/api/mealmenu',
        SEARCH: '/api/mealmenu/search',
    },
    // Yemek Puanlama
    MENU_POINT: {
        GET_ALL: '/api/menupoint',
        GET_BY_MENU: '/api/menupoint',
        GET_BY_USER: '/api/menupoint',
        GET_AVERAGE: '/api/menupoint/average',
        ADD: '/api/menupoint',
        UPDATE: '/api/menupoint',
        DELETE: '/api/menupoint',
    },
    // Yemek Yorumları
    MENU_COMMENT: {
        GET_ALL: '/api/menucomment',
        GET_BY_MENU: '/api/menucomment',
        GET_BY_USER: '/api/menucomment',
        ADD: '/api/menucomment',
        UPDATE: '/api/menucomment',
        DELETE: '/api/menucomment',
    },
    // Gün Puanlama
    DAY_POINT: {
        GET_ALL: '/api/DayPoint',
        GET_BY_USER: '/api/DayPoint',
        GET_BY_DATE: '/api/DayPoint',
        ADD: '/api/DayPoint',
        UPDATE: '/api/DayPoint',
        DELETE: '/api/DayPoint',
    },
    // Gün Yorumları
    DAY_COMMENT: {
        GET_ALL: '/api/DayComment',
        GET_BY_USER: '/api/DayComment',
        GET_BY_DATE: '/api/DayComment',
        ADD: '/api/DayComment',
        UPDATE: '/api/DayComment',
        DELETE: '/api/DayComment',
    },
    // Raporlar
    REPORT: {
        GENERAL_STATS: '/api/Report/general-stats',
        TODAY_AVERAGE: '/api/Report/today-average',
        DAILY_AVERAGES: '/api/Report/daily-averages',
        MEALS_BY_RATING: '/api/Report/meals-by-rating',
        TODAY_COMMENTS: '/api/Report/today-comments',
        COMMENTS_BY_DATE: '/api/Report/comments-by-date',
        COMMENTS_BY_DATE_RANGE: '/api/Report/comments-by-date-range',
        WEEKLY_SUMMARY: '/api/Report/weekly-summary',
        MONTHLY_SUMMARY: '/api/Report/monthly-summary',
        DASHBOARD: '/api/Report/dashboard-summary',
    },
    // Excel İşlemleri
    EXCEL: {
        IMPORT: '/api/mealmenu/importfromexcel',
        EXPORT: '/api/mealmenu/exporttoexcel',
        TEMPLATE: '/api/mealmenu/template',
    },
};

// Eski format için uyumluluk (isteğe bağlı kullanım)
export const API_ENDPOINTS = {
    IMPORT_EXCEL: '/api/mealmenu/importfromexcel',
    GET_MENUS: '/api/mealmenu',
    GET_MENU_BY_ID: '/api/mealmenu',
    MENU_COMMENT: '/api/menucomment',
    MENU_POINT: '/api/menupoint',
    DAY_COMMENT: '/api/DayComment',
    DAY_POINT: '/api/DayPoint',
    REPORTS: {
        GENERAL_STATS: '/api/Report/general-stats',
        TODAY_AVERAGE: '/api/Report/today-average',
        MEALS_BY_RATING: '/api/Report/meals-by-rating',
        DAILY_AVERAGES: '/api/Report/daily-averages',
        TODAY_COMMENTS: '/api/Report/today-comments',
        COMMENTS_BY_DATE: '/api/Report/comments-by-date',
        COMMENTS_BY_DATE_RANGE: '/api/Report/comments-by-date-range',
    },
};

// Öğün Zamanları
export const MEAL_TIMES = {
    UNKNOWN: 0,
    LUNCH: 1,
    DINNER: 2,
};

export const MEAL_TIME_LABELS = {
    [MEAL_TIMES.UNKNOWN]: 'Belirsiz',
    [MEAL_TIMES.LUNCH]: 'Öğle',
    [MEAL_TIMES.DINNER]: 'Akşam',
};

// Yemek Kategorileri
export const MEAL_CATEGORIES = [
    { value: 'ÇORBA', label: 'Çorba', color: '#faad14', icon: '🍲' },
    { value: 'ANA YEMEK', label: 'Ana Yemek', color: '#f5222d', icon: '🍖' },
    { value: 'YARDIMCI YEMEK', label: 'Yardımcı Yemek', color: '#52c41a', icon: '🥗' },
    { value: 'SPESYEL SALATA', label: 'Spesyel Salata', color: '#13c2c2', icon: '🥬' },
    { value: 'CORNER', label: 'Corner', color: '#722ed1', icon: '🍕' },
    { value: 'Diğer', label: 'Diğer', color: '#8c8c8c', icon: '🍽️' },
];

// Kategori Sıralama Düzeni
export const CATEGORY_ORDER = [
    'ÇORBA',
    'ANA YEMEK',
    'SPESYEL SALATA',
    'YARDIMCI YEMEK',
    'CORNER',
    'Diğer',
];

// Puan Açıklamaları
export const RATING_DESCRIPTIONS = {
    1: 'Çok Kötü',
    2: 'Kötü',
    3: 'Orta',
    4: 'İyi',
    5: 'Çok İyi',
};

// Türkçe Ay İsimleri
export const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

// Türkçe Gün İsimleri (Kısa)
export const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Türkçe Gün İsimleri (Tam)
export const DAY_NAMES_FULL = [
    'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar',
];

// Roller
export const YEMEKHANE_ROLES = {
    USER: 'User',
    ADMIN: 'Admin',
    YEMEKHANE_ADMIN: 'YemekhaneAdmin',
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Kategori rengini döndürür
 */
export const getCategoryColor = (category) => {
    const found = MEAL_CATEGORIES.find((c) => c.value === category);
    return found ? found.color : '#8c8c8c';
};

/**
 * Kategori ikonunu döndürür
 */
export const getCategoryIcon = (category) => {
    const found = MEAL_CATEGORIES.find((c) => c.value === category);
    return found ? found.icon : '🍽️';
};

/**
 * Öğün zamanı metnini döndürür
 */
export const getMealTimeText = (mealTime) => {
    return MEAL_TIME_LABELS[mealTime] || 'Belirsiz';
};

/**
 * Tarihi formatlar (DD.MM.YYYY)
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
};

/**
 * Bugün mü kontrol eder
 */
export const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const d = new Date(date);
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
};

/**
 * Varsayılan öğün sekmesini döndürür (saat 15'e göre)
 */
export const getDefaultMealTab = () => {
    const hour = new Date().getHours();
    return hour < 15 ? MEAL_TIMES.LUNCH : MEAL_TIMES.DINNER;
};