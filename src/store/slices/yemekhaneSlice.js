/**
 * Yemekhane Redux Slice
 * State yönetimi ve async thunk işlemleri
 *
 * ✅ FIX: searchFood thunk düzeltildi - artık doğru servis fonksiyonunu çağırıyor
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

/**
 * ✅ FIX: searchFood thunk - mealMenuService.searchFood çağırıyor
 */
export const searchFood = createAsyncThunk(
    'yemekhane/searchFood',
    async (searchTerm, { rejectWithValue }) => {
        try {
            // ✅ searchFood fonksiyonu artık mealMenuService'de mevcut
            const data = await mealMenuService.searchFood(searchTerm);
            return data;
        } catch (error) {
            console.error('Arama hatası:', error);
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
            const data = await menuPointService.add(pointData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Puanlama eklenemedi');
        }
    }
);

export const updateMenuPoint = createAsyncThunk(
    'yemekhane/updateMenuPoint',
    async (pointData, { rejectWithValue }) => {
        try {
            const data = await menuPointService.update(pointData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Puanlama güncellenemedi');
        }
    }
);

// ==================== ASYNC THUNKS - RAPORLAMA ====================

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
    async (params, { rejectWithValue }) => {
        try {
            const data = await reportService.getDailyAverages(params);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Günlük ortalamalar yüklenemedi');
        }
    }
);

export const fetchMealsByRating = createAsyncThunk(
    'yemekhane/fetchMealsByRating',
    async (params, { rejectWithValue }) => {
        try {
            const data = await reportService.getMealsByRating(params);
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
                state.menuData = action.payload.data?.data || action.payload.data || [];
                // NOT: selectedDate burada SET EDİLMEMELİ - döngüye neden olur!
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
                state.menuData = action.payload?.data || action.payload || [];
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
                state.monthlyMenus = action.payload?.data || action.payload || [];
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
                state.monthlyMenus = action.payload?.data || action.payload || [];
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
            .addCase(deleteMenuItem.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Menü başarıyla silindi';
            })
            .addCase(deleteMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Arama ==========
            .addCase(searchFood.pending, (state) => {
                state.searchLoading = true;
                state.error = null;
            })
            .addCase(searchFood.fulfilled, (state, action) => {
                state.searchLoading = false;
                // ✅ FIX: searchFood artık doğrudan sonuç dizisi döndürüyor
                state.searchResults = action.payload || [];
                state.showSearchResults = (action.payload && action.payload.length > 0);
            })
            .addCase(searchFood.rejected, (state, action) => {
                state.searchLoading = false;
                state.searchResults = [];
                state.showSearchResults = false;
                state.error = action.payload;
            })

            // ========== Excel ==========
            .addCase(importFromExcel.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(importFromExcel.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Excel dosyası başarıyla içe aktarıldı';
            })
            .addCase(importFromExcel.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Puanlama ==========
            .addCase(addMenuPoint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(addMenuPoint.fulfilled, (state) => {
                state.submitting = false;
                state.successMessage = 'Puanlama başarıyla eklendi';
            })
            .addCase(addMenuPoint.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // ========== Raporlama ==========
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

            .addCase(fetchDailyAverages.fulfilled, (state, action) => {
                state.dailyAverages = action.payload || [];
            })

            .addCase(fetchMealsByRating.fulfilled, (state, action) => {
                state.mealsByRating = action.payload || [];
            })

            .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
                state.dashboardSummary = action.payload;
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