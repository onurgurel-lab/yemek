/**
 * Yemekhane API Sabitleri ve Yardımcı Fonksiyonlar
 */

// API Endpoint Tanımları
export const YEMEKHANE_ENDPOINTS = {
    // Menu İşlemleri
    MENU: {
        GET_ALL: '/MealMenu/GetAll',
        GET_BY_ID: '/MealMenu/GetById',
        GET_BY_DATE: '/MealMenu/GetByDate',
        GET_BY_MONTH: '/MealMenu/GetByMonth',
        GET_BY_DATE_RANGE: '/MealMenu/GetByDateRange',
        CREATE: '/MealMenu/Create',
        UPDATE: '/MealMenu/Update',
        DELETE: '/MealMenu/Delete',
        SEARCH: '/MealMenu/Search',
    },
    // Yemek Puanlama
    MENU_POINT: {
        GET_ALL: '/MealMenuPoint/GetAll',
        GET_BY_MENU: '/MealMenuPoint/GetByMenuId',
        GET_BY_USER: '/MealMenuPoint/GetByUser',
        GET_AVERAGE: '/MealMenuPoint/GetAverage',
        ADD: '/MealMenuPoint/Add',
        UPDATE: '/MealMenuPoint/Update',
        DELETE: '/MealMenuPoint/Delete',
    },
    // Yemek Yorumları
    MENU_COMMENT: {
        GET_ALL: '/MealMenuComment/GetAll',
        GET_BY_MENU: '/MealMenuComment/GetByMenuId',
        GET_BY_USER: '/MealMenuComment/GetByUser',
        ADD: '/MealMenuComment/Add',
        UPDATE: '/MealMenuComment/Update',
        DELETE: '/MealMenuComment/Delete',
    },
    // Gün Puanlama
    DAY_POINT: {
        GET_ALL: '/MealDayPoint/GetAll',
        GET_BY_USER: '/MealDayPoint/GetByUser',
        GET_BY_DATE: '/MealDayPoint/GetByDate',
        ADD: '/MealDayPoint/Add',
        UPDATE: '/MealDayPoint/Update',
        DELETE: '/MealDayPoint/Delete',
    },
    // Gün Yorumları
    DAY_COMMENT: {
        GET_ALL: '/MealDayComment/GetAll',
        GET_BY_USER: '/MealDayComment/GetByUser',
        GET_BY_DATE: '/MealDayComment/GetByDate',
        ADD: '/MealDayComment/Add',
        UPDATE: '/MealDayComment/Update',
        DELETE: '/MealDayComment/Delete',
    },
    // Raporlar
    REPORT: {
        GENERAL_STATS: '/MealReport/GetGeneralStats',
        TODAY_AVERAGE: '/MealReport/GetTodayAverage',
        DAILY_AVERAGES: '/MealReport/GetDailyAverages',
        MEALS_BY_RATING: '/MealReport/GetMealsByRating',
        TODAY_COMMENTS: '/MealReport/GetTodayComments',
        COMMENTS_BY_DATE: '/MealReport/GetCommentsByDate',
        WEEKLY_SUMMARY: '/MealReport/GetWeeklySummary',
        MONTHLY_SUMMARY: '/MealReport/GetMonthlySummary',
        DASHBOARD: '/MealReport/GetDashboardSummary',
    },
    // Excel İşlemleri
    EXCEL: {
        IMPORT: '/MealExcel/Import',
        EXPORT: '/MealExcel/Export',
        TEMPLATE: '/MealExcel/GetTemplate',
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
    return hour < 15 ? 'lunch' : 'dinner';
};

/**
 * Puan açıklamasını döndürür
 */
export const getRatingDescription = (rating) => {
    return RATING_DESCRIPTIONS[rating] || '';
};

/**
 * Ay ve yıl stringi döndürür
 */
export const getMonthYearString = (date) => {
    const d = new Date(date);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Kategorileri sıralar
 */
export const sortByCategory = (items) => {
    return [...items].sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a.category);
        const indexB = CATEGORY_ORDER.indexOf(b.category);
        const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
        const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
        return orderA - orderB;
    });
};

/**
 * Öğüne göre filtreler
 */
export const filterByMealTime = (items, mealTime) => {
    if (!mealTime) return items;
    const mealTimeValue = mealTime === 'lunch' ? MEAL_TIMES.LUNCH : MEAL_TIMES.DINNER;
    return items.filter((item) => item.mealTime === mealTimeValue);
};