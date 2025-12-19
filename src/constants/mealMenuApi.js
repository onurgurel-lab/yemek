/**
 * Yemekhane API Sabitleri ve Yardımcı Fonksiyonlar
 *
 * @module constants/mealMenuApi
 */

// ==================== API ENDPOINT TANIMLARI ====================

export const API_ENDPOINTS = {
    IMPORT_EXCEL: '/api/mealmenu/importfromexcel',
    GET_MENUS: '/api/mealmenu',
    GET_MENU_BY_ID: '/api/mealmenu',
    MENU_COMMENT: '/api/menucomment',
    MENU_POINT: '/api/menupoint',
    DAY_COMMENT: '/api/DayComment',
    DAY_POINT: '/api/DayPoint',
    // Raporlama endpoint'leri
    REPORTS: {
        GENERAL_STATS: '/api/Report/general-stats',
        TODAY_AVERAGE: '/api/Report/today-average',
        MEALS_BY_RATING: '/api/Report/meals-by-rating',
        DAILY_AVERAGES: '/api/Report/daily-averages',
        TODAY_COMMENTS: '/api/Report/today-comments',
        COMMENTS_BY_DATE: '/api/Report/comments-by-date',
        COMMENTS_BY_DATE_RANGE: '/api/Report/comments-by-date-range'
    }
};

// Geriye uyumluluk için endpoint yapısı
export const YEMEKHANE_ENDPOINTS = {
    // Menu İşlemleri
    MENU: {
        GET_ALL: API_ENDPOINTS.GET_MENUS,
        GET_BY_ID: API_ENDPOINTS.GET_MENU_BY_ID,
        GET_BY_DATE: API_ENDPOINTS.GET_MENUS,
        GET_BY_MONTH: API_ENDPOINTS.GET_MENUS,
        GET_BY_DATE_RANGE: API_ENDPOINTS.GET_MENUS,
        CREATE: API_ENDPOINTS.GET_MENUS,
        UPDATE: API_ENDPOINTS.GET_MENUS,
        DELETE: API_ENDPOINTS.GET_MENUS,
        SEARCH: API_ENDPOINTS.GET_MENUS,
    },
    // Yemek Puanlama
    MENU_POINT: {
        GET_ALL: API_ENDPOINTS.MENU_POINT,
        GET_BY_MENU: API_ENDPOINTS.MENU_POINT,
        GET_BY_USER: API_ENDPOINTS.MENU_POINT,
        GET_AVERAGE: API_ENDPOINTS.MENU_POINT,
        ADD: API_ENDPOINTS.MENU_POINT,
        UPDATE: API_ENDPOINTS.MENU_POINT,
        DELETE: API_ENDPOINTS.MENU_POINT,
    },
    // Yemek Yorumları
    MENU_COMMENT: {
        GET_ALL: API_ENDPOINTS.MENU_COMMENT,
        GET_BY_MENU: API_ENDPOINTS.MENU_COMMENT,
        GET_BY_USER: API_ENDPOINTS.MENU_COMMENT,
        ADD: API_ENDPOINTS.MENU_COMMENT,
        UPDATE: API_ENDPOINTS.MENU_COMMENT,
        DELETE: API_ENDPOINTS.MENU_COMMENT,
    },
    // Gün Puanlama
    DAY_POINT: {
        GET_ALL: API_ENDPOINTS.DAY_POINT,
        GET_BY_USER: API_ENDPOINTS.DAY_POINT,
        GET_BY_DATE: API_ENDPOINTS.DAY_POINT,
        ADD: API_ENDPOINTS.DAY_POINT,
        UPDATE: API_ENDPOINTS.DAY_POINT,
        DELETE: API_ENDPOINTS.DAY_POINT,
    },
    // Gün Yorumları
    DAY_COMMENT: {
        GET_ALL: API_ENDPOINTS.DAY_COMMENT,
        GET_BY_USER: API_ENDPOINTS.DAY_COMMENT,
        GET_BY_DATE: API_ENDPOINTS.DAY_COMMENT,
        ADD: API_ENDPOINTS.DAY_COMMENT,
        UPDATE: API_ENDPOINTS.DAY_COMMENT,
        DELETE: API_ENDPOINTS.DAY_COMMENT,
    },
    // Raporlar
    REPORT: {
        GENERAL_STATS: API_ENDPOINTS.REPORTS.GENERAL_STATS,
        TODAY_AVERAGE: API_ENDPOINTS.REPORTS.TODAY_AVERAGE,
        DAILY_AVERAGES: API_ENDPOINTS.REPORTS.DAILY_AVERAGES,
        MEALS_BY_RATING: API_ENDPOINTS.REPORTS.MEALS_BY_RATING,
        TODAY_COMMENTS: API_ENDPOINTS.REPORTS.TODAY_COMMENTS,
        COMMENTS_BY_DATE: API_ENDPOINTS.REPORTS.COMMENTS_BY_DATE,
        COMMENTS_BY_DATE_RANGE: API_ENDPOINTS.REPORTS.COMMENTS_BY_DATE_RANGE,
    },
    // Excel İşlemleri
    EXCEL: {
        IMPORT: API_ENDPOINTS.IMPORT_EXCEL,
    },
};

// ==================== ÖĞÜN ZAMANLARI ====================

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

// ==================== YEMEK KATEGORİLERİ ====================

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

// ==================== PUAN AÇIKLAMALARI ====================

export const RATING_DESCRIPTIONS = {
    1: 'Çok Kötü',
    2: 'Kötü',
    3: 'Orta',
    4: 'İyi',
    5: 'Çok İyi',
};

// ==================== TARİH İSİMLERİ ====================

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

// ==================== ROLLER ====================

export const YEMEKHANE_ROLES = {
    USER: 'User',
    ADMIN: 'Admin',
    YEMEKHANE_ADMIN: 'YemekhaneAdmin',
    RAPOR_ADMIN: 'RaporAdmin',
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Kategori rengini döndürür
 */
export const getCategoryColor = (category) => {
    const found = MEAL_CATEGORIES.find((c) =>
        c.value.toLowerCase() === category?.toLowerCase()
    );
    return found ? found.color : '#8c8c8c';
};

/**
 * Kategori ikonunu döndürür
 */
export const getCategoryIcon = (category) => {
    const found = MEAL_CATEGORIES.find((c) =>
        c.value.toLowerCase() === category?.toLowerCase()
    );
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
 * Tarihi YYYY-MM-DD formatında döndürür
 */
export const formatDateISO = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
 * Ay adını döndürür
 */
export const getMonthName = (monthIndex) => {
    return MONTH_NAMES[monthIndex] || '';
};

/**
 * Gün adını döndürür (kısa)
 */
export const getDayName = (dayIndex) => {
    return DAY_NAMES[dayIndex] || '';
};

/**
 * Gün adını döndürür (tam)
 */
export const getDayNameFull = (dayIndex) => {
    return DAY_NAMES_FULL[dayIndex] || '';
};

/**
 * Tarihten gün adını döndürür
 */
export const getDayNameFromDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const dayIndex = d.getDay();
    // JavaScript'te Pazar = 0, biz Pazartesi = 0 istiyoruz
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAY_NAMES_FULL[adjustedIndex];
};

/**
 * API URL'ini oluşturur
 */
export const buildApiUrl = (endpoint, params = {}) => {
    let url = endpoint;
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
            queryParams.append(key, params[key]);
        }
    });

    const queryString = queryParams.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    return url;
};

/**
 * Menü endpoint'ini ID ile oluşturur
 */
export const getMenuByIdUrl = (id) => {
    return `${API_ENDPOINTS.GET_MENU_BY_ID}/${id}`;
};

/**
 * Yorum endpoint'ini ID ile oluşturur
 */
export const getCommentByIdUrl = (id) => {
    return `${API_ENDPOINTS.MENU_COMMENT}/${id}`;
};

/**
 * Puan endpoint'ini ID ile oluşturur
 */
export const getPointByIdUrl = (id) => {
    return `${API_ENDPOINTS.MENU_POINT}/${id}`;
};

/**
 * Gün yorumu endpoint'ini ID ile oluşturur
 */
export const getDayCommentByIdUrl = (id) => {
    return `${API_ENDPOINTS.DAY_COMMENT}/${id}`;
};

/**
 * Gün puanı endpoint'ini ID ile oluşturur
 */
export const getDayPointByIdUrl = (id) => {
    return `${API_ENDPOINTS.DAY_POINT}/${id}`;
};

// ==================== DEFAULT EXPORT ====================

export default {
    API_ENDPOINTS,
    YEMEKHANE_ENDPOINTS,
    MEAL_TIMES,
    MEAL_TIME_LABELS,
    MEAL_CATEGORIES,
    CATEGORY_ORDER,
    RATING_DESCRIPTIONS,
    MONTH_NAMES,
    DAY_NAMES,
    DAY_NAMES_FULL,
    YEMEKHANE_ROLES,
    getCategoryColor,
    getCategoryIcon,
    getMealTimeText,
    formatDate,
    formatDateISO,
    isToday,
    getDefaultMealTab,
    getRatingDescription,
    getMonthName,
    getDayName,
    getDayNameFull,
    getDayNameFromDate,
    buildApiUrl,
    getMenuByIdUrl,
    getCommentByIdUrl,
    getPointByIdUrl,
    getDayCommentByIdUrl,
    getDayPointByIdUrl,
};