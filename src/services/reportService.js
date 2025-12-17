/**
 * Raporlama Servis Modülü
 * İstatistik ve rapor sorgulama işlemleri
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS } from '@/constants/mealMenuApi';

const { REPORT } = YEMEKHANE_ENDPOINTS;

// ==================== GENEL İSTATİSTİKLER ====================

/**
 * Genel istatistikleri getirir
 */
export const getGeneralStats = async () => {
    const response = await axiosInstance.get(REPORT.GENERAL_STATS);
    return response.data;
};

/**
 * Bugünün ortalama puanını getirir
 */
export const getTodayAverage = async () => {
    const response = await axiosInstance.get(REPORT.TODAY_AVERAGE);
    return response.data;
};

/**
 * Puana göre yemekleri getirir (en iyi/en kötü)
 */
export const getMealsByRating = async (limit = 10, ascending = false) => {
    const response = await axiosInstance.get(REPORT.MEALS_BY_RATING, {
        params: { limit, ascending },
    });
    return response.data;
};

// ==================== GÜNLÜK RAPORLAR ====================

/**
 * Günlük ortalamaları getirir
 */
export const getDailyAverages = async (startDate, endDate) => {
    const response = await axiosInstance.get(REPORT.DAILY_AVERAGES, {
        params: { startDate, endDate },
    });
    return response.data;
};

/**
 * Belirli tarihteki yemekleri getirir
 */
export const getMealsByDate = async (date) => {
    const response = await axiosInstance.get(REPORT.MEALS_BY_DATE, {
        params: { date },
    });
    return response.data;
};

// ==================== YORUM RAPORLARI ====================

/**
 * Bugünün yorumlarını getirir
 */
export const getTodayComments = async () => {
    const response = await axiosInstance.get(REPORT.TODAY_COMMENTS);
    return response.data;
};

/**
 * Belirli tarihteki yorumları getirir
 */
export const getCommentsByDate = async (date) => {
    const response = await axiosInstance.get(REPORT.COMMENTS_BY_DATE, {
        params: { date },
    });
    return response.data;
};

/**
 * Tarih aralığındaki yorumları getirir
 */
export const getCommentsByDateRange = async (startDate, endDate) => {
    const response = await axiosInstance.get(REPORT.COMMENTS_BY_DATE, {
        params: { startDate, endDate },
    });
    return response.data;
};

// ==================== ÖZET RAPORLAR ====================

/**
 * Haftalık özet raporu getirir
 */
export const getWeeklySummary = async () => {
    const response = await axiosInstance.get(REPORT.WEEKLY_SUMMARY);
    return response.data;
};

/**
 * Aylık özet raporu getirir
 */
export const getMonthlySummary = async (year, month) => {
    const response = await axiosInstance.get(REPORT.MONTHLY_SUMMARY, {
        params: { year, month },
    });
    return response.data;
};

/**
 * Dashboard özet verilerini getirir
 */
export const getDashboardSummary = async () => {
    try {
        const response = await axiosInstance.get(REPORT.DASHBOARD);
        return response.data;
    } catch (error) {
        // Fallback: Temel verileri birleştir
        const [stats, todayAvg, topMeals] = await Promise.all([
            getGeneralStats().catch(() => null),
            getTodayAverage().catch(() => null),
            getMealsByRating(5).catch(() => []),
        ]);

        return {
            totalRatings: stats?.totalRatings || 0,
            totalComments: stats?.totalComments || 0,
            todayAverage: todayAvg?.average || 0,
            activeUsers: stats?.activeUsers || 0,
            topMeals: topMeals,
        };
    }
};

// ==================== TREND ANALİZİ ====================

/**
 * Trend analizini hesaplar
 */
export const getTrendAnalysis = async (days = 7) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const dailyAverages = await getDailyAverages(startDate, endDate);

    if (!dailyAverages || dailyAverages.length < 2) {
        return {
            trend: 'stable',
            percentChange: 0,
            averages: dailyAverages || [],
        };
    }

    // Son iki günün karşılaştırması
    const recent = dailyAverages.slice(-2);
    const previousAvg = recent[0]?.average || 0;
    const currentAvg = recent[1]?.average || 0;

    let trend = 'stable';
    let percentChange = 0;

    if (previousAvg > 0) {
        percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

        if (percentChange > 5) {
            trend = 'up';
        } else if (percentChange < -5) {
            trend = 'down';
        }
    }

    return {
        trend,
        percentChange: Math.round(percentChange * 10) / 10,
        averages: dailyAverages,
        currentAverage: currentAvg,
        previousAverage: previousAvg,
    };
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Rapor verilerini formatlar
 */
export const formatReportData = (data) => {
    if (!data) return null;

    return {
        ...data,
        formattedDate: data.date
            ? new Date(data.date).toLocaleDateString('tr-TR')
            : null,
        averageFormatted: data.average ? data.average.toFixed(2) : '0.00',
    };
};

/**
 * Puan dağılımını hesaplar
 */
export const calculateRatingDistribution = (ratings) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!Array.isArray(ratings)) return distribution;

    ratings.forEach((r) => {
        const rating = r.point || r.rating || 0;
        if (rating >= 1 && rating <= 5) {
            distribution[Math.round(rating)]++;
        }
    });

    return distribution;
};

/**
 * En aktif kullanıcıları hesaplar
 */
export const getTopActiveUsers = (evaluations, limit = 10) => {
    if (!Array.isArray(evaluations)) return [];

    const userCounts = {};

    evaluations.forEach((e) => {
        const userId = e.userId || e.uId;
        if (userId) {
            if (!userCounts[userId]) {
                userCounts[userId] = {
                    userId,
                    userName: e.userName || e.userFullName || 'Bilinmiyor',
                    count: 0,
                };
            }
            userCounts[userId].count++;
        }
    });

    return Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

export default {
    getGeneralStats,
    getTodayAverage,
    getMealsByRating,
    getDailyAverages,
    getMealsByDate,
    getTodayComments,
    getCommentsByDate,
    getCommentsByDateRange,
    getWeeklySummary,
    getMonthlySummary,
    getDashboardSummary,
    getTrendAnalysis,
    formatReportData,
    calculateRatingDistribution,
    getTopActiveUsers,
};