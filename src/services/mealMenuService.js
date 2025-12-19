/**
 * mealMenuService.js - Yemek Menüsü Servis Modülü
 *
 * Eski projedeki mealMenuService'in axios ve yeni yapıya uyarlaması
 * CRUD işlemleri, arama, gruplama ve Excel işlemleri
 *
 * @module services/mealMenuService
 */

import axiosInstance from '@/utils/axiosInstance';
import { CATEGORY_ORDER } from '@/constants/mealMenuApi';

// ==================== API ENDPOINT ====================
const MENU_API = '/api/mealmenu';

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Tarih nesnesini "YYYY-MM-DD" formatına çevirir
 * @param {Date|string} date - Tarih nesnesi veya string
 * @returns {string} YYYY-MM-DD formatında tarih
 */
const formatDate = (date) => {
    if (!date) return '';

    // String ise ve zaten doğru formatta ise direkt döndür
    if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
        }
        // ISO format ise sadece tarih kısmını al
        if (date.includes('T')) {
            return date.split('T')[0];
        }
        date = new Date(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Debounce için timer
 */
let searchTimeout = null;

// ==================== CRUD İŞLEMLERİ ====================

/**
 * Tüm menüleri getirir
 * @returns {Promise<Array>} Menü listesi
 */
export const getAllMenus = async () => {
    const response = await axiosInstance.get(MENU_API);
    return response.data?.data || response.data || [];
};

/**
 * ID'ye göre menü getirir
 * @param {number|string} id - Menü ID'si
 * @returns {Promise<Object|null>} Menü objesi
 */
export const getMenuById = async (id) => {
    const response = await axiosInstance.get(`${MENU_API}/${id}`);
    return response.data?.data || response.data || null;
};

/**
 * Tarihe göre menü getirir
 * @param {Date|string} date - Tarih
 * @returns {Promise<Array>} Menü listesi
 */
export const getMenuByDate = async (date) => {
    const formattedDate = formatDate(date);
    const response = await axiosInstance.get(MENU_API, {
        params: { date: formattedDate },
    });
    return response.data?.data || response.data || [];
};

/**
 * Bugünün menüsünü getirir
 * @returns {Promise<Array>} Bugünün menüsü
 */
export const getTodayMenu = async () => {
    const today = new Date();
    return getMenuByDate(today);
};

/**
 * Yeni menü öğesi oluşturur
 * @param {Object} menuData - Menü verisi
 * @returns {Promise<Object>} API yanıtı
 */
export const createMenuItem = async (menuData) => {
    const response = await axiosInstance.post(MENU_API, menuData, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

/**
 * Menü öğesini günceller
 * @param {Object} menuData - Güncellenecek menü verisi (id dahil)
 * @returns {Promise<Object>} API yanıtı
 */
export const updateMenuItem = async (menuData) => {
    const response = await axiosInstance.put(MENU_API, menuData, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

/**
 * Menü öğesini siler
 * @param {number|string} id - Silinecek menü ID'si
 * @returns {Promise<Object>} API yanıtı
 */
export const deleteMenuItem = async (id) => {
    const response = await axiosInstance.delete(`${MENU_API}/${id}`);
    return response.data;
};

// ==================== SORGULAMA İŞLEMLERİ ====================

/**
 * Aya göre menüleri getirir
 * @param {number} year - Yıl
 * @param {number} month - Ay (0-11)
 * @returns {Promise<Array>} Menü listesi
 */
export const getMenusByMonth = async (year, month) => {
    try {
        // Ayın başlangıç ve bitiş tarihlerini hesapla
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const response = await axiosInstance.get(MENU_API, {
            params: { startDate, endDate },
        });
        return response.data?.data || response.data || [];
    } catch (error) {
        console.error('Aylık menüler alınırken hata:', error);
        throw error;
    }
};

/**
 * YYYY-MM formatında aya göre menüleri getirir (geriye uyumluluk)
 * @param {string} yearMonth - YYYY-MM formatında yıl-ay
 * @returns {Promise<Array>} Menü listesi
 */
export const getMenusByYearMonth = async (yearMonth) => {
    try {
        const year = parseInt(yearMonth.substring(0, 4));
        const month = parseInt(yearMonth.substring(5, 7)) - 1; // 0-indexed
        return getMenusByMonth(year, month);
    } catch (error) {
        console.error('Aylık menüler alınırken hata:', error);
        throw error;
    }
};

/**
 * Tarih aralığına göre menüleri getirir
 * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Promise<Array>} Menü listesi
 */
export const getMenusByDateRange = async (startDate, endDate) => {
    try {
        const response = await axiosInstance.get(MENU_API, {
            params: { startDate, endDate },
        });
        return response.data?.data || response.data || [];
    } catch (error) {
        console.error('Tarih aralığı menüleri alınırken hata:', error);
        throw error;
    }
};

/**
 * Yemek ismine göre arama yapar (debounce ile)
 * @param {string} foodName - Aranacak yemek adı
 * @returns {Promise<Array>} Gruplandırılmış arama sonuçları
 */
export const searchFood = (foodName) => {
    return new Promise((resolve, reject) => {
        // Önceki timeout'u temizle
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Yeni timeout oluştur
        searchTimeout = setTimeout(async () => {
            try {
                if (!foodName || foodName.trim() === '') {
                    resolve([]);
                    return;
                }

                const searchTerm = foodName.trim();

                // İçinde bulunduğumuz ayın tarih aralığını hesapla
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
                const lastDay = new Date(currentYear, currentMonth, 0).getDate();
                const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

                // Search parametresiyle istek at
                const response = await axiosInstance.get(MENU_API, {
                    params: {
                        search: searchTerm,
                        startDate,
                        endDate,
                    },
                });

                const matchingMenus = response.data?.data || response.data || [];

                // Tarihe göre grupla ve sırala
                const groupedByDate = matchingMenus.reduce((groups, menu) => {
                    const menuDate = menu.menuDate?.split('T')[0] || formatDate(menu.menuDate);
                    if (!groups[menuDate]) {
                        groups[menuDate] = [];
                    }
                    groups[menuDate].push(menu);
                    return groups;
                }, {});

                // Tarihleri sırala ve sonuç formatını oluştur
                const sortedResults = Object.keys(groupedByDate)
                    .sort()
                    .map((date) => ({
                        date,
                        menus: groupedByDate[date],
                    }));

                resolve(sortedResults);
            } catch (error) {
                console.error('Yemek arama sırasında hata:', error);
                reject(error);
            }
        }, 500); // 500ms debounce
    });
};

// Geriye uyumluluk için alias
export const searchFoodByName = searchFood;

// ==================== GRUPLAMA İŞLEMLERİ ====================

/**
 * Kategori bazında menüleri gruplar
 * @param {Array} menuItems - Menü listesi
 * @returns {Object} Kategoriye göre gruplandırılmış menüler
 */
export const groupMenusByCategory = (menuItems) => {
    if (!Array.isArray(menuItems)) return {};

    const grouped = menuItems.reduce((groups, item) => {
        const category = item.category || 'Diğer';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});

    // CATEGORY_ORDER varsa sıralı döndür
    if (CATEGORY_ORDER && Array.isArray(CATEGORY_ORDER)) {
        const sortedGroups = {};
        CATEGORY_ORDER.forEach((cat) => {
            if (grouped[cat]) {
                sortedGroups[cat] = grouped[cat];
            }
        });
        // Sıralamada olmayan kategorileri ekle
        Object.keys(grouped).forEach((cat) => {
            if (!sortedGroups[cat]) {
                sortedGroups[cat] = grouped[cat];
            }
        });
        return sortedGroups;
    }

    return grouped;
};

/**
 * Öğün zamanı bazında menüleri gruplar
 * @param {Array} menuItems - Menü listesi
 * @returns {Object} Öğüne göre gruplandırılmış menüler
 */
export const groupMenusByMealTime = (menuItems) => {
    if (!Array.isArray(menuItems)) return {};

    return menuItems.reduce((groups, item) => {
        const mealTime = item.mealTime || 0;
        if (!groups[mealTime]) {
            groups[mealTime] = [];
        }
        groups[mealTime].push(item);
        return groups;
    }, {});
};

/**
 * Toplam kalori hesaplar
 * @param {Array} menuItems - Menü listesi
 * @returns {number} Toplam kalori
 */
export const calculateTotalCalories = (menuItems) => {
    if (!Array.isArray(menuItems)) return 0;

    return menuItems.reduce((total, item) => {
        return total + (item.calories || item.calorie || 0);
    }, 0);
};

/**
 * Menü verilerini standart formata dönüştürür
 * @param {Object} rawData - Ham menü verisi
 * @returns {Object|null} Formatlanmış menü verisi
 */
export const formatMenuData = (rawData) => {
    if (!rawData) return null;

    return {
        id: rawData.id,
        foodName: rawData.foodName,
        category: rawData.category,
        calories: rawData.calories || rawData.calorie || 0,
        menuDate: rawData.menuDate,
        mealTime: rawData.mealTime,
        notes: rawData.notes || '',
        isVegetarian: rawData.isVegetarian || false,
        allergens: rawData.allergens || [],
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
    };
};

// ==================== EXCEL İŞLEMLERİ ====================

/**
 * Excel'den menü içe aktarır
 * @param {File} file - Excel dosyası
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Import sonucu
 */
export const importFromExcel = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
        '/api/mealmenu/importfromexcel',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        }
    );
    return response.data;
};

/**
 * Menüleri Excel olarak dışa aktarır
 * @returns {Promise<Blob>} Excel dosyası blob'u
 */
export const exportToExcel = async () => {
    const response = await axiosInstance.get(
        '/api/mealmenu/exporttoexcel',
        {
            responseType: 'blob',
        }
    );
    return response.data;
};

// ==================== MealTime YARDIMCI FONKSİYONLARI ====================

/**
 * MealTime enum değerini string'e çevirir
 * @param {number} mealTime - MealTime değeri (1: Öğle, 2: Akşam)
 * @returns {string} Öğün adı
 */
export const getMealTimeText = (mealTime) => {
    switch (mealTime) {
        case 1:
            return 'Öğle';
        case 2:
            return 'Akşam';
        case 0:
        default:
            return 'Bilinmiyor';
    }
};

/**
 * Kategori rengini belirler
 * @param {string} category - Kategori adı
 * @returns {string} Renk kodu
 */
export const getCategoryColor = (category) => {
    const colors = {
        'ÇORBA': '#3498db',
        'ANA YEMEK': '#e74c3c',
        'SPESYEL SALATA': '#27ae60',
        'YARDIMCI YEMEK': '#f39c12',
        'CORNER': '#9b59b6',
        'Diğer': '#95a5a6',
    };
    return colors[category] || '#95a5a6';
};

/**
 * Kategori ikonunu belirler
 * @param {string} category - Kategori adı
 * @returns {string} Emoji ikon
 */
export const getCategoryIcon = (category) => {
    const icons = {
        'ÇORBA': '🍲',
        'ANA YEMEK': '🍖',
        'SPESYEL SALATA': '🥗',
        'YARDIMCI YEMEK': '🍛',
        'CORNER': '🍕',
        'Diğer': '🍽️',
    };
    return icons[category] || '🍽️';
};

// ==================== DEFAULT EXPORT ====================

const mealMenuService = {
    // CRUD
    getAllMenus,
    getMenuById,
    getMenuByDate,
    getTodayMenu,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,

    // Sorgulama
    getMenusByMonth,
    getMenusByYearMonth,
    getMenusByDateRange,
    searchFood,
    searchFoodByName, // Alias (geriye uyumluluk)

    // Yardımcı
    groupMenusByCategory,
    groupMenusByMealTime,
    calculateTotalCalories,
    formatMenuData,
    formatDate,
    getMealTimeText,
    getCategoryColor,
    getCategoryIcon,

    // Excel
    importFromExcel,
    exportToExcel,
};

export default mealMenuService;