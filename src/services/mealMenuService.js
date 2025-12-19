/**
 * Yemek Menüsü Servis Modülü
 * CRUD işlemleri ve sorgulama fonksiyonları
 *
 * @module services/mealMenuService
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS, CATEGORY_ORDER } from '@/constants/mealMenuApi';

const { MENU } = YEMEKHANE_ENDPOINTS;

// ==================== CRUD İŞLEMLERİ ====================

/**
 * Tüm menüleri getirir
 */
export const getAllMenus = async () => {
    const response = await axiosInstance.get(MENU.GET_ALL);
    return response.data;
};

/**
 * ID'ye göre menü getirir
 */
export const getMenuById = async (id) => {
    const response = await axiosInstance.get(`${MENU.GET_BY_ID}/${id}`);
    return response.data;
};

/**
 * Tarihe göre menü getirir
 */
export const getMenuByDate = async (date) => {
    const response = await axiosInstance.get(MENU.GET_BY_DATE, {
        params: { date },
    });
    return response.data;
};

/**
 * Bugünün menüsünü getirir
 */
export const getTodayMenu = async () => {
    const today = new Date().toISOString().split('T')[0];
    return getMenuByDate(today);
};

/**
 * Yeni menü öğesi oluşturur
 */
export const createMenuItem = async (menuData) => {
    const response = await axiosInstance.post(MENU.CREATE, menuData);
    return response.data;
};

/**
 * Menü öğesini günceller
 */
export const updateMenuItem = async (menuData) => {
    const response = await axiosInstance.put(MENU.UPDATE, menuData);
    return response.data;
};

/**
 * Menü öğesini siler
 */
export const deleteMenuItem = async (id) => {
    const response = await axiosInstance.delete(`${MENU.DELETE}/${id}`);
    return response.data;
};

// ==================== SORGULAMA İŞLEMLERİ ====================

/**
 * Aya göre menüleri getirir
 */
export const getMenusByMonth = async (year, month) => {
    // Ayın başlangıç ve bitiş tarihlerini hesapla
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const response = await axiosInstance.get(MENU.GET_BY_DATE_RANGE, {
        params: { startDate: startStr, endDate: endStr },
    });
    return response.data;
};

/**
 * Tarih aralığına göre menüleri getirir
 */
export const getMenusByDateRange = async (startDate, endDate) => {
    const response = await axiosInstance.get(MENU.GET_BY_DATE_RANGE, {
        params: { startDate, endDate },
    });
    return response.data;
};

/**
 * Yemek adına göre arama yapar
 * ✅ FIX: Bu fonksiyon artık doğrudan export ediliyor
 *
 * @param {string} searchTerm - Aranacak yemek adı
 * @param {string} [month] - Opsiyonel ay filtresi (YYYY-MM formatı)
 * @returns {Promise<Array>} Arama sonuçları
 */
export const searchFood = async (searchTerm, month) => {
    try {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return [];
        }

        // Eğer month parametresi varsa, o ayın menülerinde ara
        let menus;
        if (month) {
            const year = new Date(month).getFullYear();
            const monthIndex = new Date(month).getMonth();
            menus = await getMenusByMonth(year, monthIndex);
        } else {
            menus = await getAllMenus();
        }

        const menuData = menus?.data || menus || [];

        if (!Array.isArray(menuData)) return [];

        // Yemek adına göre filtrele (case-insensitive)
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        const filteredMenus = menuData.filter(menu =>
            menu.foodName?.toLowerCase().includes(normalizedSearchTerm)
        );

        // Sonuçları tarihe göre sırala (en yeni önce)
        const sortedResults = filteredMenus.sort((a, b) =>
            new Date(b.menuDate) - new Date(a.menuDate)
        );

        // İlk 50 sonucu döndür (performans için)
        return sortedResults.slice(0, 50);
    } catch (error) {
        console.error('Yemek araması hatası:', error);
        return [];
    }
};

// Alias: Geriye uyumluluk için
export const searchFoodByName = searchFood;

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Menü öğelerini kategorilere göre gruplar
 */
export const groupMenusByCategory = (menuItems) => {
    if (!Array.isArray(menuItems)) return {};

    const grouped = menuItems.reduce((acc, item) => {
        const category = item.category || 'Diğer';
        const normalizedCategory = category.toLowerCase().trim();
        const matchedCategory = CATEGORY_ORDER.find(
            cat => cat.toLowerCase() === normalizedCategory
        ) || 'Diğer';

        if (!acc[matchedCategory]) {
            acc[matchedCategory] = [];
        }
        acc[matchedCategory].push(item);
        return acc;
    }, {});

    // Kategorileri sırala
    const sortedGrouped = {};
    CATEGORY_ORDER.forEach((cat) => {
        if (grouped[cat]) {
            sortedGrouped[cat] = grouped[cat];
        }
    });

    // Sıralamada olmayan kategorileri ekle
    Object.keys(grouped).forEach((cat) => {
        if (!sortedGrouped[cat]) {
            sortedGrouped[cat] = grouped[cat];
        }
    });

    return sortedGrouped;
};

/**
 * Menü öğelerini öğün zamanına göre gruplar
 */
export const groupMenusByMealTime = (menuItems) => {
    if (!Array.isArray(menuItems)) return { lunch: [], dinner: [] };

    return {
        lunch: menuItems.filter((item) => item.mealTime === 1),
        dinner: menuItems.filter((item) => item.mealTime === 2),
    };
};

/**
 * Toplam kaloriyi hesaplar
 */
export const calculateTotalCalories = (menuItems) => {
    if (!Array.isArray(menuItems)) return 0;
    return menuItems.reduce((total, item) => total + (item.calories || item.calorie || 0), 0);
};

/**
 * Menü verilerini formata dönüştürür
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
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
    };
};

// ==================== EXCEL İŞLEMLERİ ====================

/**
 * Excel'den menü içe aktarır
 */
export const importFromExcel = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
        YEMEKHANE_ENDPOINTS.EXCEL?.IMPORT || '/api/mealmenu/importfromexcel',
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
    getMenusByDateRange,
    searchFood,           // ✅ FIX: Artık doğru isimle export
    searchFoodByName,     // Alias (geriye uyumluluk)

    // Yardımcı
    groupMenusByCategory,
    groupMenusByMealTime,
    calculateTotalCalories,
    formatMenuData,

    // Excel
    importFromExcel,
};

export default mealMenuService;