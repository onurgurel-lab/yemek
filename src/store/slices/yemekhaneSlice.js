/**
 * yemekhaneSlice.js - Yemekhane Redux Slice
 *
 * Menü yönetimi için state yönetimi
 * Eski projedeki state yapısının Redux Toolkit uyarlaması
 *
 * @module store/slices/yemekhaneSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mealMenuService from '@/services/mealMenuService';

// ==================== INITIAL STATE ====================

const initialState = {
    // Menü verileri
    menuData: [],
    todayMenu: [],
    searchResults: [],

    // Seçili değerler
    selectedDate: null,
    currentMonth: null,
    activeTab: 'lunch', // 'lunch' | 'dinner'
    searchTerm: '',

    // UI state
    showSearchResults: false,
    showWeeklyPopup: false,
    showMonthlyPopup: false,
    showDayEvaluationPopup: false,

    // Loading states
    loading: false,
    submitting: false,
    searchLoading: false,

    // Error state
    error: null,
};

// ==================== ASYNC THUNKS ====================

/**
 * Tarihe göre menü getir
 */
export const fetchMenuByDate = createAsyncThunk(
    'yemekhane/fetchMenuByDate',
    async (date, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.getMenuByDate(date);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Menü yüklenirken hata oluştu');
        }
    }
);

/**
 * Bugünün menüsünü getir
 */
export const fetchTodayMenu = createAsyncThunk(
    'yemekhane/fetchTodayMenu',
    async (_, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.getTodayMenu();
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Menü yüklenirken hata oluştu');
        }
    }
);

/**
 * Yemek arama
 */
export const searchFood = createAsyncThunk(
    'yemekhane/searchFood',
    async (searchTerm, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.searchFood(searchTerm);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Arama sırasında hata oluştu');
        }
    }
);

/**
 * Yeni menü öğesi oluştur
 */
export const createMenuItem = createAsyncThunk(
    'yemekhane/createMenuItem',
    async (menuData, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.createMenuItem(menuData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Menü eklenirken hata oluştu'
            );
        }
    }
);

/**
 * Menü öğesi güncelle
 */
export const updateMenuItem = createAsyncThunk(
    'yemekhane/updateMenuItem',
    async (menuData, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.updateMenuItem(menuData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Menü güncellenirken hata oluştu'
            );
        }
    }
);

/**
 * Menü öğesi sil
 */
export const deleteMenuItem = createAsyncThunk(
    'yemekhane/deleteMenuItem',
    async (id, { rejectWithValue }) => {
        try {
            await mealMenuService.deleteMenuItem(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Menü silinirken hata oluştu'
            );
        }
    }
);

/**
 * Aylık menüleri getir
 */
export const fetchMenusByMonth = createAsyncThunk(
    'yemekhane/fetchMenusByMonth',
    async ({ year, month }, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.getMenusByMonth(year, month);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Aylık menü yüklenirken hata oluştu');
        }
    }
);

/**
 * Tarih aralığına göre menüleri getir
 */
export const fetchMenusByDateRange = createAsyncThunk(
    'yemekhane/fetchMenusByDateRange',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const response = await mealMenuService.getMenusByDateRange(startDate, endDate);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Menüler yüklenirken hata oluştu');
        }
    }
);

// ==================== SLICE ====================

const yemekhaneSlice = createSlice({
    name: 'yemekhane',
    initialState,
    reducers: {
        // Seçili tarihi ayarla
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },

        // Mevcut ayı ayarla
        setCurrentMonth: (state, action) => {
            state.currentMonth = action.payload;
        },

        // Aktif tab'ı ayarla (öğle/akşam)
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },

        // Arama terimini ayarla
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
        },

        // Arama sonuçlarını temizle
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.showSearchResults = false;
            state.searchTerm = '';
        },

        // Haftalık popup toggle
        toggleWeeklyPopup: (state, action) => {
            state.showWeeklyPopup = action.payload ?? !state.showWeeklyPopup;
        },

        // Aylık popup toggle
        toggleMonthlyPopup: (state, action) => {
            state.showMonthlyPopup = action.payload ?? !state.showMonthlyPopup;
        },

        // Gün değerlendirme popup toggle
        toggleDayEvaluationPopup: (state, action) => {
            state.showDayEvaluationPopup = action.payload ?? !state.showDayEvaluationPopup;
        },

        // Arama sonuçlarını göster/gizle
        setShowSearchResults: (state, action) => {
            state.showSearchResults = action.payload;
        },

        // Hata temizle
        clearError: (state) => {
            state.error = null;
        },

        // State'i sıfırla
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // fetchMenuByDate
            .addCase(fetchMenuByDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenuByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.menuData = action.payload;
            })
            .addCase(fetchMenuByDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // fetchTodayMenu
            .addCase(fetchTodayMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTodayMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.todayMenu = action.payload;
                state.menuData = action.payload;
            })
            .addCase(fetchTodayMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // searchFood
            .addCase(searchFood.pending, (state) => {
                state.searchLoading = true;
            })
            .addCase(searchFood.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchResults = action.payload;
                state.showSearchResults = action.payload.length > 0;
            })
            .addCase(searchFood.rejected, (state, action) => {
                state.searchLoading = false;
                state.error = action.payload;
            })

            // createMenuItem
            .addCase(createMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createMenuItem.fulfilled, (state, action) => {
                state.submitting = false;
                // Menü listesini yenilemek için ayrı bir fetch çağrısı yapılacak
            })
            .addCase(createMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // updateMenuItem
            .addCase(updateMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateMenuItem.fulfilled, (state, action) => {
                state.submitting = false;
            })
            .addCase(updateMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // deleteMenuItem
            .addCase(deleteMenuItem.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteMenuItem.fulfilled, (state, action) => {
                state.submitting = false;
                // Silinen öğeyi listeden kaldır
                state.menuData = state.menuData.filter(
                    (item) => item.id !== action.payload
                );
            })
            .addCase(deleteMenuItem.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // fetchMenusByMonth
            .addCase(fetchMenusByMonth.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMenusByMonth.fulfilled, (state, action) => {
                state.loading = false;
                state.menuData = action.payload;
            })
            .addCase(fetchMenusByMonth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // fetchMenusByDateRange
            .addCase(fetchMenusByDateRange.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMenusByDateRange.fulfilled, (state, action) => {
                state.loading = false;
                state.menuData = action.payload;
            })
            .addCase(fetchMenusByDateRange.rejected, (state, action) => {
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
    clearSearchResults,
    toggleWeeklyPopup,
    toggleMonthlyPopup,
    toggleDayEvaluationPopup,
    setShowSearchResults,
    clearError,
    resetState,
} = yemekhaneSlice.actions;

// ==================== SELECTORS ====================

export const selectMenuData = (state) => state.yemekhane.menuData;
export const selectTodayMenu = (state) => state.yemekhane.todayMenu;
export const selectSelectedDate = (state) => state.yemekhane.selectedDate;
export const selectCurrentMonth = (state) => state.yemekhane.currentMonth;
export const selectActiveTab = (state) => state.yemekhane.activeTab;
export const selectSearchTerm = (state) => state.yemekhane.searchTerm;
export const selectSearchResults = (state) => state.yemekhane.searchResults;
export const selectShowSearchResults = (state) => state.yemekhane.showSearchResults;
export const selectShowWeeklyPopup = (state) => state.yemekhane.showWeeklyPopup;
export const selectShowMonthlyPopup = (state) => state.yemekhane.showMonthlyPopup;
export const selectShowDayEvaluationPopup = (state) => state.yemekhane.showDayEvaluationPopup;
export const selectLoading = (state) => state.yemekhane.loading;
export const selectSubmitting = (state) => state.yemekhane.submitting;
export const selectSearchLoading = (state) => state.yemekhane.searchLoading;
export const selectError = (state) => state.yemekhane.error;

// ==================== DEFAULT EXPORT ====================

export default yemekhaneSlice.reducer;