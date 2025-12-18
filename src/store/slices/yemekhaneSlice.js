/**
 * Yemekhane Redux Slice
 * State yönetimi ve async thunk işlemleri
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as mealMenuService from '@/services/mealMenuService';
import {
    menuPointService,
    menuCommentService,
    dayPointService,
    dayCommentService,
} from '@/services/evaluationService';
import * as reportService from '@/services/reportService';
import * as excelService from '@/services/excelService';
import { getDefaultMealTab } from '@/constants/mealMenuApi';

// ==================== ASYNC THUNKS - MENÜ ====================

export const fetchMenuByDate = createAsyncThunk(
    'yemekhane/fetchMenuByDate',
    async (date, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.getMenuByDate(date);
            return { date, data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Menü yüklenemedi');
        }
    }
);

export const fetchTodayMenu = createAsyncThunk(
    'yemekhane/fetchTodayMenu',
    async (_, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.getTodayMenu();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Bugünün menüsü yüklenemedi');
        }
    }
);

export const fetchMenusByMonth = createAsyncThunk(
    'yemekhane/fetchMenusByMonth',
    async ({ year, month }, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.getMenusByMonth(year, month);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Aylık menü yüklenemedi');
        }
    }
);

export const fetchMenusByDateRange = createAsyncThunk(
    'yemekhane/fetchMenusByDateRange',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.getMenusByDateRange(startDate, endDate);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Menüler yüklenemedi');
        }
    }
);

export const createMenuItem = createAsyncThunk(
    'yemekhane/createMenuItem',
    async (menuData, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.createMenuItem(menuData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Menü eklenemedi');
        }
    }
);

export const updateMenuItem = createAsyncThunk(
    'yemekhane/updateMenuItem',
    async ({ id, menuData }, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.updateMenuItem(id, menuData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Menü güncellenemedi');
        }
    }
);

export const deleteMenuItem = createAsyncThunk(
    'yemekhane/deleteMenuItem',
    async (id, { rejectWithValue }) => {
        try {
            await mealMenuService.deleteMenuItem(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Menü silinemedi');
        }
    }
);

export const searchFood = createAsyncThunk(
    'yemekhane/searchFood',
    async (searchTerm, { rejectWithValue }) => {
        try {
            const data = await mealMenuService.searchFood(searchTerm);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Arama başarısız');
        }
    }
);

// ==================== ASYNC THUNKS - EXCEL ====================

export const importFromExcel = createAsyncThunk(
    'yemekhane/importFromExcel',
    async (file, { rejectWithValue }) => {
        try {
            const data = await excelService.importFromExcel(file);
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Excel içe aktarımı başarısız');
        }
    }
);

// ==================== ASYNC THUNKS - PUANLAMA ====================

export const addMenuPoint = createAsyncThunk(
    'yemekhane/addMenuPoint',
    async (pointData, { rejectWithValue }) => {
        try {
            const data = await menuPointService.addPoint(pointData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Puan eklenemedi');
        }
    }
);

export const updateMenuPoint = createAsyncThunk(
    'yemekhane/updateMenuPoint',
    async ({ id, pointData }, { rejectWithValue }) => {
        try {
            const data = await menuPointService.updatePoint(id, pointData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Puan güncellenemedi');
        }
    }
);

export const deleteMenuPoint = createAsyncThunk(
    'yemekhane/deleteMenuPoint',
    async (id, { rejectWithValue }) => {
        try {
            await menuPointService.deletePoint(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Puan silinemedi');
        }
    }
);

// ==================== ASYNC THUNKS - YORUM ====================

export const addMenuComment = createAsyncThunk(
    'yemekhane/addMenuComment',
    async (commentData, { rejectWithValue }) => {
        try {
            const data = await menuCommentService.addComment(commentData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Yorum eklenemedi');
        }
    }
);

export const updateMenuComment = createAsyncThunk(
    'yemekhane/updateMenuComment',
    async ({ id, commentData }, { rejectWithValue }) => {
        try {
            const data = await menuCommentService.updateComment(id, commentData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Yorum güncellenemedi');
        }
    }
);

export const deleteMenuComment = createAsyncThunk(
    'yemekhane/deleteMenuComment',
    async (id, { rejectWithValue }) => {
        try {
            await menuCommentService.deleteComment(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Yorum silinemedi');
        }
    }
);

// ==================== ASYNC THUNKS - GÜN DEĞERLENDİRME ====================

export const addDayPoint = createAsyncThunk(
    'yemekhane/addDayPoint',
    async (pointData, { rejectWithValue }) => {
        try {
            const data = await dayPointService.addPoint(pointData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Gün puanı eklenemedi');
        }
    }
);

export const addDayComment = createAsyncThunk(
    'yemekhane/addDayComment',
    async (commentData, { rejectWithValue }) => {
        try {
            const data = await dayCommentService.addComment(commentData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Gün yorumu eklenemedi');
        }
    }
);

// ==================== ASYNC THUNKS - RAPORLAR ====================

export const fetchGeneralStats = createAsyncThunk(
    'yemekhane/fetchGeneralStats',
    async (_, { rejectWithValue }) => {
        try {
            const data = await reportService.getGeneralStats();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'İstatistikler yüklenemedi');
        }
    }
);

export const fetchDailyAverages = createAsyncThunk(
    'yemekhane/fetchDailyAverages',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const data = await reportService.getDailyAverages(startDate, endDate);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Günlük ortalamalar yüklenemedi');
        }
    }
);

export const fetchMealsByRating = createAsyncThunk(
    'yemekhane/fetchMealsByRating',
    async (_, { rejectWithValue }) => {
        try {
            const data = await reportService.getMealsByRating();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Yemek puanları yüklenemedi');
        }
    }
);

export const fetchDashboardSummary = createAsyncThunk(
    'yemekhane/fetchDashboardSummary',
    async (_, { rejectWithValue }) => {
        try {
            const data = await reportService.getDashboardSummary();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Dashboard verisi yüklenemedi');
        }
    }
);

// ==================== INITIAL STATE ====================

const initialState = {
    // Menü verileri
    menuData: [],
    monthlyMenus: [],
    selectedDate: new Date().toISOString().split('T')[0],
    currentMonth: new Date().toISOString().slice(0, 7),
    activeTab: getDefaultMealTab(),

    // Arama
    searchTerm: '',
    searchResults: [],
    showSearchResults: false,

    // Modal durumları
    showWeeklyPopup: false,
    showMonthlyPopup: false,
    showDayEvaluationPopup: false,
    hasExistingEvaluation: false,

    // Rapor verileri
    generalStats: null,
    dailyAverages: [],
    mealsByRating: [],
    dashboardSummary: null,

    // Yükleme durumları
    loading: false,
    searchLoading: false,
    submitting: false,

    // Hata ve başarı mesajları
    error: null,
    successMessage: null,
};

// ==================== SLICE ====================

const yemekhaneSlice = createSlice({
    name: 'yemekhane',
    initialState,
    reducers: {
        // Tarih işlemleri
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
        setCurrentMonth: (state, action) => {
            state.currentMonth = action.payload;
        },

        // Tab işlemleri
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },

        // Arama işlemleri
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
        },
        setShowSearchResults: (state, action) => {
            state.showSearchResults = action.payload;
        },
        clearSearch: (state) => {
            state.searchTerm = '';
            state.searchResults = [];
            state.showSearchResults = false;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.showSearchResults = false;
        },

        // Modal işlemleri
        setShowWeeklyPopup: (state, action) => {
            state.showWeeklyPopup = action.payload;
        },
        setShowMonthlyPopup: (state, action) => {
            state.showMonthlyPopup = action.payload;
        },
        setShowDayEvaluationPopup: (state, action) => {
            state.showDayEvaluationPopup = action.payload;
        },

        // Toggle işlemleri
        toggleWeeklyPopup: (state) => {
            state.showWeeklyPopup = !state.showWeeklyPopup;
        },
        toggleMonthlyPopup: (state) => {
            state.showMonthlyPopup = !state.showMonthlyPopup;
        },
        toggleDayEvaluationPopup: (state) => {
            state.showDayEvaluationPopup = !state.showDayEvaluationPopup;
        },

        setHasExistingEvaluation: (state, action) => {
            state.hasExistingEvaluation = action.payload;
        },

        // Hata ve mesaj işlemleri
        clearError: (state) => {
            state.error = null;
        },
        clearSuccessMessage: (state) => {
            state.successMessage = null;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },

        // Reset
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // ========== Menü Fetch ==========
            .addCase(fetchMenuByDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenuByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.menuData = action.payload.data || [];
                // NOT: selectedDate burada SET EDİLMEMELİ - döngüye neden olur!
                // selectedDate sadece setSelectedDate action'ı ile değişmeli
            })
            .addCase(fetchMenuByDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ========== Bugünün Menüsü ==========
            .addCase(fetchTodayMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTodayMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.menuData = action.payload || [];
                // NOT: selectedDate burada SET EDİLMEMELİ - döngüye neden olur!
                // selectedDate sadece setSelectedDate action'ı ile değişmeli
            })
            .addCase(fetchTodayMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ========== Aylık Menü ==========
            .addCase(fetchMenusByMonth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenusByMonth.fulfilled, (state, action) => {
                state.loading = false;
                state.monthlyMenus = action.payload || [];
            })
            .addCase(fetchMenusByMonth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ========== Tarih Aralığı ==========
            .addCase(fetchMenusByDateRange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenusByDateRange.fulfilled, (state, action) => {
                state.loading = false;
                state.monthlyMenus = action.payload || [];
            })
            .addCase(fetchMenusByDateRange.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ========== Menü CRUD ==========
            .addCase(createMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createMenuItem.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Menü başarıyla eklendi';
            })
            .addCase(createMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(updateMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateMenuItem.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Menü başarıyla güncellendi';
            })
            .addCase(updateMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(deleteMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteMenuItem.fulfilled, (state, action) => {
                state.submitting = false;
                state.menuData = state.menuData.filter((item) => item.id !== action.payload);
                state.successMessage = 'Menü başarıyla silindi';
            })
            .addCase(deleteMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Arama ==========
            .addCase(searchFood.pending, (state) => {
                state.searchLoading = true;
            })
            .addCase(searchFood.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchResults = action.payload || [];
                state.showSearchResults = true;
            })
            .addCase(searchFood.rejected, (state) => {
                state.searchLoading = false;
                state.searchResults = [];
            })

            // ========== Excel Import ==========
            .addCase(importFromExcel.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(importFromExcel.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Excel başarıyla içe aktarıldı';
            })
            .addCase(importFromExcel.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Menü Puanlama ==========
            .addCase(addMenuPoint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(addMenuPoint.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Puan eklendi';
            })
            .addCase(addMenuPoint.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(updateMenuPoint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(updateMenuPoint.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Puan güncellendi';
            })
            .addCase(updateMenuPoint.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(deleteMenuPoint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(deleteMenuPoint.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Puan silindi';
            })
            .addCase(deleteMenuPoint.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Menü Yorum ==========
            .addCase(addMenuComment.pending, (state) => {
                state.submitting = true;
            })
            .addCase(addMenuComment.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Yorum eklendi';
            })
            .addCase(addMenuComment.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(updateMenuComment.pending, (state) => {
                state.submitting = true;
            })
            .addCase(updateMenuComment.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Yorum güncellendi';
            })
            .addCase(updateMenuComment.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(deleteMenuComment.pending, (state) => {
                state.submitting = true;
            })
            .addCase(deleteMenuComment.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Yorum silindi';
            })
            .addCase(deleteMenuComment.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Gün Değerlendirme ==========
            .addCase(addDayPoint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(addDayPoint.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Gün puanı eklendi';
            })
            .addCase(addDayPoint.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            .addCase(addDayComment.pending, (state) => {
                state.submitting = true;
            })
            .addCase(addDayComment.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Gün yorumu eklendi';
            })
            .addCase(addDayComment.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Raporlar ==========
            .addCase(fetchGeneralStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGeneralStats.fulfilled, (state, action) => {
                state.loading = false;
                state.generalStats = action.payload;
            })
            .addCase(fetchGeneralStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchDailyAverages.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDailyAverages.fulfilled, (state, action) => {
                state.loading = false;
                state.dailyAverages = action.payload;
            })
            .addCase(fetchDailyAverages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchMealsByRating.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMealsByRating.fulfilled, (state, action) => {
                state.loading = false;
                state.mealsByRating = action.payload;
            })
            .addCase(fetchMealsByRating.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchDashboardSummary.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboardSummary = action.payload;
            })
            .addCase(fetchDashboardSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// ==================== ACTIONS ====================

export const {
    setSelectedDate,
    setCurrentMonth,
    setActiveTab,
    setSearchTerm,
    setShowSearchResults,
    clearSearch,
    clearSearchResults,
    setShowWeeklyPopup,
    setShowMonthlyPopup,
    setShowDayEvaluationPopup,
    toggleWeeklyPopup,
    toggleMonthlyPopup,
    toggleDayEvaluationPopup,
    setHasExistingEvaluation,
    clearError,
    clearSuccessMessage,
    setError,
    resetState,
} = yemekhaneSlice.actions;

// ==================== SELECTORS ====================

export const selectMenuData = (state) => state.yemekhane.menuData;
export const selectMonthlyMenus = (state) => state.yemekhane.monthlyMenus;
export const selectSelectedDate = (state) => state.yemekhane.selectedDate;
export const selectCurrentMonth = (state) => state.yemekhane.currentMonth;
export const selectActiveTab = (state) => state.yemekhane.activeTab;
export const selectSearchTerm = (state) => state.yemekhane.searchTerm;
export const selectSearchResults = (state) => state.yemekhane.searchResults;
export const selectShowSearchResults = (state) => state.yemekhane.showSearchResults;
export const selectShowWeeklyPopup = (state) => state.yemekhane.showWeeklyPopup;
export const selectShowMonthlyPopup = (state) => state.yemekhane.showMonthlyPopup;
export const selectShowDayEvaluationPopup = (state) => state.yemekhane.showDayEvaluationPopup;
export const selectHasExistingEvaluation = (state) => state.yemekhane.hasExistingEvaluation;
export const selectGeneralStats = (state) => state.yemekhane.generalStats;
export const selectDailyAverages = (state) => state.yemekhane.dailyAverages;
export const selectMealsByRating = (state) => state.yemekhane.mealsByRating;
export const selectDashboardSummary = (state) => state.yemekhane.dashboardSummary;
export const selectLoading = (state) => state.yemekhane.loading;
export const selectSearchLoading = (state) => state.yemekhane.searchLoading;
export const selectSubmitting = (state) => state.yemekhane.submitting;
export const selectError = (state) => state.yemekhane.error;
export const selectSuccessMessage = (state) => state.yemekhane.successMessage;

export default yemekhaneSlice.reducer;