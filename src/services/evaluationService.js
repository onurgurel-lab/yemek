/**
 * Değerlendirme Servis Modülü
 * Menü ve gün puanlama/yorumlama işlemleri
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS } from '@/constants/mealMenuApi';

const { MENU_POINT, MENU_COMMENT, DAY_POINT, DAY_COMMENT } = YEMEKHANE_ENDPOINTS;

// ==================== MENÜ PUANLAMA SERVİSİ ====================

export const menuPointService = {
    /**
     * Tüm menü puanlarını getirir
     */
    getAll: async () => {
        const response = await axiosInstance.get(MENU_POINT.GET_ALL);
        return response.data;
    },

    /**
     * Menü ID'sine göre puanları getirir
     */
    getByMenuId: async (menuId) => {
        const response = await axiosInstance.get(MENU_POINT.GET_BY_MENU, {
            params: { menuId },
        });
        return response.data;
    },

    /**
     * Kullanıcının puanlarını getirir
     */
    getByUser: async (userId) => {
        const response = await axiosInstance.get(MENU_POINT.GET_BY_USER, {
            params: { userId },
        });
        return response.data;
    },

    /**
     * Menü için ortalama puanı getirir
     */
    getAverage: async (menuId) => {
        const response = await axiosInstance.get(MENU_POINT.GET_AVERAGE, {
            params: { menuId },
        });
        return response.data;
    },

    /**
     * Yeni puan ekler
     */
    add: async (pointData) => {
        const response = await axiosInstance.post(MENU_POINT.ADD, pointData);
        return response.data;
    },

    /**
     * Puanı günceller
     */
    update: async (pointData) => {
        const response = await axiosInstance.put(MENU_POINT.UPDATE, pointData);
        return response.data;
    },

    /**
     * Puanı siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(MENU_POINT.DELETE, {
            params: { id },
        });
        return response.data;
    },
};

// ==================== MENÜ YORUM SERVİSİ ====================

export const menuCommentService = {
    /**
     * Tüm menü yorumlarını getirir
     */
    getAll: async () => {
        const response = await axiosInstance.get(MENU_COMMENT.GET_ALL);
        return response.data;
    },

    /**
     * Menü ID'sine göre yorumları getirir
     */
    getByMenuId: async (menuId) => {
        const response = await axiosInstance.get(MENU_COMMENT.GET_BY_MENU, {
            params: { menuId },
        });
        return response.data;
    },

    /**
     * Kullanıcının yorumlarını getirir
     */
    getByUser: async (userId) => {
        const response = await axiosInstance.get(MENU_COMMENT.GET_BY_USER, {
            params: { userId },
        });
        return response.data;
    },

    /**
     * Yeni yorum ekler
     */
    add: async (commentData) => {
        const response = await axiosInstance.post(MENU_COMMENT.ADD, commentData);
        return response.data;
    },

    /**
     * Yorumu günceller
     */
    update: async (commentData) => {
        const response = await axiosInstance.put(MENU_COMMENT.UPDATE, commentData);
        return response.data;
    },

    /**
     * Yorumu siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(MENU_COMMENT.DELETE, {
            params: { id },
        });
        return response.data;
    },
};

// ==================== GÜN PUANLAMA SERVİSİ ====================

export const dayPointService = {
    /**
     * Tüm gün puanlarını getirir
     */
    getAll: async () => {
        const response = await axiosInstance.get(DAY_POINT.GET_ALL);
        return response.data;
    },

    /**
     * Kullanıcının gün puanlarını getirir
     */
    getByUser: async (userId) => {
        const response = await axiosInstance.get(DAY_POINT.GET_BY_USER, {
            params: { userId },
        });
        return response.data;
    },

    /**
     * Tarihe göre gün puanlarını getirir
     */
    getByDate: async (date) => {
        const response = await axiosInstance.get(DAY_POINT.GET_BY_DATE, {
            params: { date },
        });
        return response.data;
    },

    /**
     * Yeni gün puanı ekler
     */
    add: async (pointData) => {
        const response = await axiosInstance.post(DAY_POINT.ADD, pointData);
        return response.data;
    },

    /**
     * Gün puanını günceller
     */
    update: async (pointData) => {
        const response = await axiosInstance.put(DAY_POINT.UPDATE, pointData);
        return response.data;
    },

    /**
     * Gün puanını siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(DAY_POINT.DELETE, {
            params: { id },
        });
        return response.data;
    },
};

// ==================== GÜN YORUM SERVİSİ ====================

export const dayCommentService = {
    /**
     * Tüm gün yorumlarını getirir
     */
    getAll: async () => {
        const response = await axiosInstance.get(DAY_COMMENT.GET_ALL);
        return response.data;
    },

    /**
     * Kullanıcının gün yorumlarını getirir
     */
    getByUser: async (userId) => {
        const response = await axiosInstance.get(DAY_COMMENT.GET_BY_USER, {
            params: { userId },
        });
        return response.data;
    },

    /**
     * Tarihe göre gün yorumlarını getirir
     */
    getByDate: async (date) => {
        const response = await axiosInstance.get(DAY_COMMENT.GET_BY_DATE, {
            params: { date },
        });
        return response.data;
    },

    /**
     * Yeni gün yorumu ekler
     */
    add: async (commentData) => {
        const response = await axiosInstance.post(DAY_COMMENT.ADD, commentData);
        return response.data;
    },

    /**
     * Gün yorumunu günceller
     */
    update: async (commentData) => {
        const response = await axiosInstance.put(DAY_COMMENT.UPDATE, commentData);
        return response.data;
    },

    /**
     * Gün yorumunu siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(DAY_COMMENT.DELETE, {
            params: { id },
        });
        return response.data;
    },
};

// ==================== BİRLEŞİK FONKSİYONLAR ====================

/**
 * Menü için puan ve yorumları birlikte getirir
 */
export const getMenuEvaluations = async (menuId) => {
    const [points, comments] = await Promise.all([
        menuPointService.getByMenuId(menuId),
        menuCommentService.getByMenuId(menuId),
    ]);

    return { points, comments };
};

/**
 * Gün için puan ve yorumları birlikte getirir
 */
export const getDayEvaluations = async (date) => {
    const [points, comments] = await Promise.all([
        dayPointService.getByDate(date),
        dayCommentService.getByDate(date),
    ]);

    return { points, comments };
};

/**
 * Kullanıcının belirli bir menü için değerlendirmesini getirir
 */
export const getUserMenuEvaluation = async (menuId, userId) => {
    const [points, comments] = await Promise.all([
        menuPointService.getByMenuId(menuId),
        menuCommentService.getByMenuId(menuId),
    ]);

    const userPoint = points.find((p) => p.userId === userId);
    const userComment = comments.find((c) => c.userId === userId);

    return { point: userPoint, comment: userComment };
};

/**
 * Kullanıcının belirli bir gün için değerlendirmesini getirir
 */
export const getUserDayEvaluation = async (date, userId) => {
    const [points, comments] = await Promise.all([
        dayPointService.getByDate(date),
        dayCommentService.getByDate(date),
    ]);

    const userPoint = points.find((p) => p.userId === userId);
    const userComment = comments.find((c) => c.userId === userId);

    return { point: userPoint, comment: userComment };
};

/**
 * Ortalama puanı hesaplar
 */
export const calculateAverageRating = (points) => {
    if (!Array.isArray(points) || points.length === 0) return 0;
    const sum = points.reduce((acc, p) => acc + (p.point || p.rating || 0), 0);
    return (sum / points.length).toFixed(1);
};

export default {
    menuPointService,
    menuCommentService,
    dayPointService,
    dayCommentService,
    getMenuEvaluations,
    getDayEvaluations,
    getUserMenuEvaluation,
    getUserDayEvaluation,
    calculateAverageRating,
};