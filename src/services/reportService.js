/**
 * Raporlama Servis Modülü
 * İstatistik ve rapor sorgulama işlemleri
 *
 * YEMEKHANE_ENDPOINTS.REPORT yapısını kullanır.
 *
 * @module services/reportService
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS } from '@/constants/mealMenuApi';

// REPORT endpoint'lerini al
const { REPORT } = YEMEKHANE_ENDPOINTS;

// ==================== GENEL İSTATİSTİKLER ====================

/**
 * Genel istatistikleri getirir
 * @returns {Promise<Object>} Genel istatistikler
 * @example
 * const stats = await getGeneralStats();
 * // { averageRating: 3.5, totalComments: 120, highestRating: 5, ... }
 */
export const getGeneralStats = async () => {
    try {
        const response = await axiosInstance.get(REPORT.GENERAL_STATS);
        return response?.data || response;
    } catch (error) {
        console.error('getGeneralStats error:', error);
        throw error;
    }
};

/**
 * Bugünün ortalama puanını getirir
 * @returns {Promise<Object>} Bugünün ortalaması
 * @example
 * const avg = await getTodayAverage();
 * // { todayAverageRating: 4.2, date: '2024-01-15' }
 */
export const getTodayAverage = async () => {
    try {
        const response = await axiosInstance.get(REPORT.TODAY_AVERAGE);
        return response?.data || response;
    } catch (error) {
        console.error('getTodayAverage error:', error);
        throw error;
    }
};

/**
 * Puana göre yemekleri getirir (en iyi/en kötü)
 * @param {number} [limit=10] - Kaç yemek getirileceği
 * @param {boolean} [ascending=false] - Artan sıra mı
 * @returns {Promise<Array>} Yemek listesi
 */
export const getMealsByRating = async (limit = 10, ascending = false) => {
    try {
        const response = await axiosInstance.get(REPORT.MEALS_BY_RATING, {
            params: { limit, ascending },
        });
        return response?.data || response || [];
    } catch (error) {
        console.error('getMealsByRating error:', error);
        throw error;
    }
};

// ==================== GÜNLÜK RAPORLAR ====================

/**
 * Günlük ortalamaları getirir
 * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Promise<Array>} Günlük ortalamalar
 * @example
 * const dailyAvg = await getDailyAverages('2024-01-01', '2024-01-15');
 * // [{ date: '2024-01-01', averageRating: 3.8, totalRatings: 45 }, ...]
 */
export const getDailyAverages = async (startDate, endDate) => {
    try {
        const response = await axiosInstance.get(REPORT.DAILY_AVERAGES, {
            params: { startDate, endDate },
        });
        return response?.data || response || [];
    } catch (error) {
        console.error('getDailyAverages error:', error);
        throw error;
    }
};

// ==================== YORUM RAPORLARI ====================

/**
 * Bugünün yorumlarını getirir
 * @returns {Promise<Array>} Bugünün yorumları
 */
export const getTodayComments = async () => {
    try {
        const response = await axiosInstance.get(REPORT.TODAY_COMMENTS);
        return response?.data || response || [];
    } catch (error) {
        console.error('getTodayComments error:', error);
        throw error;
    }
};

/**
 * Belirli tarihteki yorumları getirir
 * @param {string} date - Tarih (YYYY-MM-DD)
 * @returns {Promise<Array>} Yorum listesi
 */
export const getCommentsByDate = async (date) => {
    try {
        const response = await axiosInstance.get(REPORT.COMMENTS_BY_DATE, {
            params: { date },
        });
        return response?.data || response || [];
    } catch (error) {
        console.error('getCommentsByDate error:', error);
        throw error;
    }
};

/**
 * Tarih aralığındaki yorumları getirir
 * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Promise<Array>} Yorum listesi
 */
export const getCommentsByDateRange = async (startDate, endDate) => {
    try {
        const response = await axiosInstance.get(REPORT.COMMENTS_BY_DATE_RANGE, {
            params: { startDate, endDate },
        });
        return response?.data || response || [];
    } catch (error) {
        console.error('getCommentsByDateRange error:', error);
        throw error;
    }
};

// ==================== DASHBOARD ÖZET ====================

/**
 * Dashboard özet verilerini getirir
 * Birden fazla endpoint'i birleştirerek özet veri döndürür.
 * @returns {Promise<Object>} Dashboard özeti
 */
export const getDashboardSummary = async () => {
    try {
        const [stats, todayAvg, topMeals] = await Promise.all([
            getGeneralStats().catch(() => null),
            getTodayAverage().catch(() => null),
            getMealsByRating(5).catch(() => []),
        ]);

        return {
            totalRatings: stats?.totalRatings || 0,
            totalComments: stats?.totalComments || 0,
            averageRating: stats?.averageRating || 0,
            highestRating: stats?.highestRating || 0,
            todayAverage: todayAvg?.todayAverageRating || todayAvg?.average || 0,
            activeUsers: stats?.activeUsers || 0,
            topMeals: topMeals,
        };
    } catch (error) {
        console.error('getDashboardSummary error:', error);
        throw error;
    }
};

// ==================== TREND ANALİZİ ====================

/**
 * Trend analizini hesaplar
 * Son N günün verilerini analiz ederek trend bilgisi döndürür.
 * @param {number} [days=7] - Analiz edilecek gün sayısı
 * @returns {Promise<Object>} Trend analizi
 * @example
 * const trend = await getTrendAnalysis(7);
 * // { trend: 'up', percentChange: 5.2, averages: [...] }
 */
export const getTrendAnalysis = async (days = 7) => {
    try {
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
        const previousAvg = recent[0]?.averageRating || recent[0]?.average || 0;
        const currentAvg = recent[1]?.averageRating || recent[1]?.average || 0;

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
    } catch (error) {
        console.error('getTrendAnalysis error:', error);
        throw error;
    }
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Rapor verilerini formatlar
 * @param {Object} data - Ham rapor verisi
 * @returns {Object|null} Formatlanmış veri
 */
export const formatReportData = (data) => {
    if (!data) return null;

    return {
        ...data,
        formattedDate: data.date
            ? new Date(data.date).toLocaleDateString('tr-TR')
            : null,
        averageFormatted: data.average
            ? data.average.toFixed(2)
            : data.averageRating
                ? data.averageRating.toFixed(2)
                : '0.00',
    };
};

/**
 * Puan dağılımını hesaplar
 * @param {Array} ratings - Puan listesi
 * @returns {Object} Puan dağılımı { 1: 5, 2: 10, 3: 25, 4: 40, 5: 20 }
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
 * @param {Array} evaluations - Değerlendirme listesi
 * @param {number} [limit=10] - Kaç kullanıcı getirileceği
 * @returns {Array} Aktif kullanıcı listesi
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

/**
 * Kategori bazlı istatistik hesapla
 * @param {Array} meals - Yemek listesi
 * @returns {Array} Kategori istatistikleri
 */
export const getCategoryStats = (meals) => {
    if (!Array.isArray(meals)) return [];

    const categoryMap = {};

    meals.forEach((meal) => {
        const category = meal.category || 'Bilinmiyor';

        if (!categoryMap[category]) {
            categoryMap[category] = {
                category,
                count: 0,
                totalRating: 0,
                ratingCount: 0,
            };
        }

        categoryMap[category].count++;

        if (meal.menuPoints && Array.isArray(meal.menuPoints)) {
            meal.menuPoints.forEach((p) => {
                categoryMap[category].totalRating += p.point || 0;
                categoryMap[category].ratingCount++;
            });
        }
    });

    return Object.values(categoryMap).map((cat) => ({
        ...cat,
        averageRating: cat.ratingCount > 0
            ? (cat.totalRating / cat.ratingCount).toFixed(2)
            : 0,
    }));
};

/**
 * Haftalık karşılaştırma verisi oluştur
 * @param {Array} dailyAverages - Günlük ortalamalar
 * @returns {Object} Haftalık karşılaştırma
 */
export const getWeeklyComparison = (dailyAverages) => {
    if (!Array.isArray(dailyAverages) || dailyAverages.length < 7) {
        return { thisWeek: 0, lastWeek: 0, change: 0 };
    }

    const thisWeek = dailyAverages.slice(-7);
    const lastWeek = dailyAverages.slice(-14, -7);

    const thisWeekAvg = thisWeek.reduce((sum, d) => sum + (d.averageRating || 0), 0) / thisWeek.length;
    const lastWeekAvg = lastWeek.length > 0
        ? lastWeek.reduce((sum, d) => sum + (d.averageRating || 0), 0) / lastWeek.length
        : 0;

    const change = lastWeekAvg > 0
        ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100
        : 0;

    return {
        thisWeek: thisWeekAvg.toFixed(2),
        lastWeek: lastWeekAvg.toFixed(2),
        change: change.toFixed(1),
    };
};

// ==================== DEFAULT EXPORT ====================

export default {
    getGeneralStats,
    getTodayAverage,
    getMealsByRating,
    getDailyAverages,
    getTodayComments,
    getCommentsByDate,
    getCommentsByDateRange,
    getDashboardSummary,
    getTrendAnalysis,
    formatReportData,
    calculateRatingDistribution,
    getTopActiveUsers,
    getCategoryStats,
    getWeeklyComparison,
};