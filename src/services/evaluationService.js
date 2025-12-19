/**
 * Değerlendirme Servis Modülü
 * Menü ve gün puanlama/yorumlama işlemleri
 *
 * ✅ FIX: Tüm POST/PUT istekleri JSON formatında gönderiliyor
 * Format: {"mealMenuId":4136,"userName":"onur.gurel","point":3,"uId":"70cf407f8dfd4723"}
 *
 * @module services/evaluationService
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS } from '@/constants/mealMenuApi';

const { MENU_POINT, MENU_COMMENT, DAY_POINT, DAY_COMMENT } = YEMEKHANE_ENDPOINTS;

// ==================== JSON CONFIG ====================

/**
 * JSON istekleri için axios config
 * FormData yerine JSON gönderir
 */
const jsonConfig = {
    headers: {
        'Content-Type': 'application/json'
    }
};

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
    getByMenuId: async (mealMenuId) => {
        const response = await axiosInstance.get(`${MENU_POINT.GET_BY_MENU}/ByMealMenu/${mealMenuId}`);
        return response.data;
    },

    /**
     * Kullanıcının puanlarını getirir
     */
    getByUser: async (uId) => {
        const response = await axiosInstance.get(`${MENU_POINT.GET_BY_USER}/ByUser/${uId}`);
        return response.data;
    },

    /**
     * Menü için ortalama puanı getirir
     */
    getAverage: async (mealMenuId) => {
        const response = await axiosInstance.get(`${MENU_POINT.GET_AVERAGE}/AverageRating/${mealMenuId}`);
        return response.data;
    },

    /**
     * Yeni puan ekler
     * ✅ JSON formatında gönderir
     *
     * @param {Object} pointData
     * @param {number} pointData.mealMenuId - Menü ID
     * @param {string} pointData.userName - Kullanıcı adı
     * @param {number} pointData.point - Puan (1-5)
     * @param {string} pointData.uId - Kullanıcı ID
     */
    add: async (pointData) => {
        const requestBody = {
            mealMenuId: pointData.mealMenuId,
            userName: pointData.userName,
            point: pointData.point,
            uId: pointData.uId
        };

        console.log('📤 MenuPoint Add Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.post(
            MENU_POINT.ADD,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Puanı günceller
     * ✅ JSON formatında gönderir
     */
    update: async (pointData) => {
        const requestBody = {
            id: pointData.id,
            point: pointData.point
        };

        console.log('📤 MenuPoint Update Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.put(
            MENU_POINT.UPDATE,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Puanı siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(`${MENU_POINT.DELETE}/${id}`);
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
    getByMenuId: async (mealMenuId) => {
        const response = await axiosInstance.get(`${MENU_COMMENT.GET_BY_MENU}/ByMealMenu/${mealMenuId}`);
        return response.data;
    },

    /**
     * Kullanıcının yorumlarını getirir
     */
    getByUser: async (uId) => {
        const response = await axiosInstance.get(`${MENU_COMMENT.GET_BY_USER}/ByUser/${uId}`);
        return response.data;
    },

    /**
     * Yeni yorum ekler
     * ✅ JSON formatında gönderir
     *
     * @param {Object} commentData
     * @param {number} commentData.mealMenuId - Menü ID
     * @param {string} commentData.userName - Kullanıcı adı
     * @param {string} commentData.comment - Yorum metni
     * @param {string} commentData.uId - Kullanıcı ID
     */
    add: async (commentData) => {
        const requestBody = {
            mealMenuId: commentData.mealMenuId,
            userName: commentData.userName,
            comment: commentData.comment,
            uId: commentData.uId
        };

        console.log('📤 MenuComment Add Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.post(
            MENU_COMMENT.ADD,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Yorumu günceller
     * ✅ JSON formatında gönderir
     */
    update: async (commentData) => {
        const requestBody = {
            id: commentData.id,
            comment: commentData.comment
        };

        console.log('📤 MenuComment Update Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.put(
            MENU_COMMENT.UPDATE,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Yorumu siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(`${MENU_COMMENT.DELETE}/${id}`);
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
    getByUser: async (uId) => {
        const response = await axiosInstance.get(`${DAY_POINT.GET_BY_USER}/ByUser/${uId}`);
        return response.data;
    },

    /**
     * Tarihe göre gün puanlarını getirir
     */
    getByDate: async (date) => {
        const response = await axiosInstance.get(`${DAY_POINT.GET_BY_DATE}/ByDate/${date}`);
        return response.data;
    },

    /**
     * Yeni gün puanı ekler
     * ✅ JSON formatında gönderir
     *
     * @param {Object} pointData
     * @param {string} pointData.pointDate - Puan tarihi (YYYY-MM-DD)
     * @param {string} pointData.userName - Kullanıcı adı
     * @param {string} pointData.uId - Kullanıcı ID
     * @param {number} pointData.point - Puan (1-5)
     */
    add: async (pointData) => {
        const requestBody = {
            pointDate: pointData.pointDate,
            userName: pointData.userName,
            uId: pointData.uId,
            point: pointData.point
        };

        console.log('📤 DayPoint Add Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.post(
            DAY_POINT.ADD,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Gün puanını günceller
     * ✅ JSON formatında gönderir
     */
    update: async (pointData) => {
        const requestBody = {
            id: pointData.id,
            point: pointData.point
        };

        console.log('📤 DayPoint Update Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.put(
            DAY_POINT.UPDATE,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Gün puanını siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(`${DAY_POINT.DELETE}/${id}`);
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
    getByUser: async (uId) => {
        const response = await axiosInstance.get(`${DAY_COMMENT.GET_BY_USER}/ByUser/${uId}`);
        return response.data;
    },

    /**
     * Tarihe göre gün yorumlarını getirir
     */
    getByDate: async (date) => {
        const response = await axiosInstance.get(`${DAY_COMMENT.GET_BY_DATE}/ByDate/${date}`);
        return response.data;
    },

    /**
     * Yeni gün yorumu ekler
     * ✅ JSON formatında gönderir
     *
     * @param {Object} commentData
     * @param {string} commentData.commentDate - Yorum tarihi (YYYY-MM-DD)
     * @param {string} commentData.userName - Kullanıcı adı
     * @param {string} commentData.uId - Kullanıcı ID
     * @param {string} commentData.comment - Yorum metni
     */
    add: async (commentData) => {
        const requestBody = {
            commentDate: commentData.commentDate,
            userName: commentData.userName,
            uId: commentData.uId,
            comment: commentData.comment
        };

        console.log('📤 DayComment Add Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.post(
            DAY_COMMENT.ADD,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Gün yorumunu günceller
     * ✅ JSON formatında gönderir
     */
    update: async (commentData) => {
        const requestBody = {
            id: commentData.id,
            comment: commentData.comment
        };

        console.log('📤 DayComment Update Request:', JSON.stringify(requestBody));

        const response = await axiosInstance.put(
            DAY_COMMENT.UPDATE,
            requestBody,
            jsonConfig
        );
        return response.data;
    },

    /**
     * Gün yorumunu siler
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(`${DAY_COMMENT.DELETE}/${id}`);
        return response.data;
    },
};

// ==================== BİRLEŞİK FONKSİYONLAR ====================

/**
 * Menü için puan ve yorumları birlikte getirir
 */
export const getMenuEvaluations = async (menuId) => {
    const [points, comments] = await Promise.all([
        menuPointService.getByMenuId(menuId).catch(() => ({ data: [] })),
        menuCommentService.getByMenuId(menuId).catch(() => ({ data: [] })),
    ]);

    return {
        points: points?.data || points || [],
        comments: comments?.data || comments || []
    };
};

/**
 * Gün için puan ve yorumları birlikte getirir
 */
export const getDayEvaluations = async (date) => {
    const [points, comments] = await Promise.all([
        dayPointService.getByDate(date).catch(() => ({ data: [] })),
        dayCommentService.getByDate(date).catch(() => ({ data: [] })),
    ]);

    return {
        points: points?.data || points || [],
        comments: comments?.data || comments || []
    };
};

/**
 * Kullanıcının belirli bir menü için değerlendirmesini getirir
 */
export const getUserMenuEvaluation = async (menuId, userId) => {
    const [points, comments] = await Promise.all([
        menuPointService.getByMenuId(menuId).catch(() => ({ data: [] })),
        menuCommentService.getByMenuId(menuId).catch(() => ({ data: [] })),
    ]);

    const pointsData = points?.data || points || [];
    const commentsData = comments?.data || comments || [];

    const userPoint = pointsData.find((p) => p.uId === userId);
    const userComment = commentsData.find((c) => c.uId === userId);

    return { point: userPoint, comment: userComment };
};

/**
 * Kullanıcının belirli bir gün için değerlendirmesini getirir
 */
export const getUserDayEvaluation = async (date, userId) => {
    const [points, comments] = await Promise.all([
        dayPointService.getByDate(date).catch(() => ({ data: [] })),
        dayCommentService.getByDate(date).catch(() => ({ data: [] })),
    ]);

    const pointsData = points?.data || points || [];
    const commentsData = comments?.data || comments || [];

    const userPoint = pointsData.find((p) => p.uId === userId);
    const userComment = commentsData.find((c) => c.uId === userId);

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

// ==================== DEFAULT EXPORT ====================

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