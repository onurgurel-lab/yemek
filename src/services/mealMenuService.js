/**
 * Yemek Menüsü Servis Modülü
 * CRUD işlemleri ve sorgulama fonksiyonları
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
    const response = await axiosInstance.get(MENU.GET_BY_ID, {
        params: { id },
    });
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
    const response = await axiosInstance.delete(MENU.DELETE, {
        params: { id },
    });
    return response.data;
};

// ==================== SORGULAMA İŞLEMLERİ ====================

/**
 * Aya göre menüleri getirir
 */
export const getMenusByMonth = async (year, month) => {
    const response = await axiosInstance.get(MENU.GET_BY_MONTH, {
        params: { year, month },
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
 * Bugünün menüsünü getirir
 */
export const getTodayMenu = async () => {
    const today = new Date().toISOString().split('T')[0];
    return getMenuByDate(today);
};

// ==================== ARAMA İŞLEMLERİ ====================

let searchTimeout = null;

/**
 * Yemek adına göre arama yapar (debounced)
 */
export const searchFoodByName = async (searchTerm, debounceMs = 500) => {
    return new Promise((resolve, reject) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(async () => {
            try {
                if (!searchTerm || searchTerm.trim().length < 2) {
                    resolve([]);
                    return;
                }

                const response = await axiosInstance.get(MENU.SEARCH, {
                    params: { query: searchTerm.trim() },
                });
                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        }, debounceMs);
    });
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Menü öğelerini kategoriye göre gruplar
 */
export const groupMenusByCategory = (menuItems) => {
    if (!Array.isArray(menuItems)) return {};

    const grouped = menuItems.reduce((acc, item) => {
        const category = item.category || 'Diğer';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
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
    return menuItems.reduce((total, item) => total + (item.calorie || 0), 0);
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
        calorie: rawData.calorie || 0,
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
        YEMEKHANE_ENDPOINTS.EXCEL.IMPORT,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            },
        }
    );

    return response.data;
};

/**
 * Excel şablonunu indirir
 */
export const downloadTemplate = async () => {
    const response = await axiosInstance.get(YEMEKHANE_ENDPOINTS.EXCEL.TEMPLATE, {
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'menu_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Menüleri Excel'e aktarır
 */
export const exportToExcel = async (startDate, endDate, filename = 'menu_export.xlsx') => {
    const response = await axiosInstance.get(YEMEKHANE_ENDPOINTS.EXCEL.EXPORT, {
        params: { startDate, endDate },
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default {
    getAllMenus,
    getMenuById,
    getMenuByDate,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenusByMonth,
    getMenusByDateRange,
    getTodayMenu,
    searchFoodByName,
    groupMenusByCategory,
    groupMenusByMealTime,
    calculateTotalCalories,
    formatMenuData,
    importFromExcel,
    downloadTemplate,
    exportToExcel,
};