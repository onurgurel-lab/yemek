/**
 * authSlice.js - Authentication Redux Slice
 *
 * ✅ FIX v3: Sayfa yenilemede auth state korunuyor
 * - getInitialState cookie'yi doğru okuyor
 * - initialized true başlıyor eğer cookie varsa
 * - Token localStorage'dan da okunuyor (backup)
 *
 * @module store/slices/authSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/auth';
import { STORAGE_KEYS } from '@/constants/config';

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

// ==================== INLINE COOKIE OKUMA ====================

/**
 * readAuthCookieInline - Cookie'yi doğru şekilde oku
 * cookieUtils import etmeden çalışır (circular dependency önleme)
 */
const readAuthCookieInline = () => {
    try {
        if (typeof document === 'undefined') return null;

        const cookieString = document.cookie;
        if (!cookieString) return null;

        const cookies = cookieString.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();

            if (cookie.startsWith('authUser=')) {
                const encodedValue = cookie.substring(9);
                if (!encodedValue) return null;

                const decodedValue = decodeURIComponent(encodedValue);
                return JSON.parse(decodedValue);
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Cookie okuma hatası (inline):', error.message);
        return null;
    }
};

// ==================== HELPER FONKSİYONLAR ====================

/**
 * extractUserRoles - Kullanıcının hedef projedeki rollerini çıkarır
 */
const extractUserRoles = (user) => {
    if (!user?.projects || !Array.isArray(user.projects)) {
        console.log('[extractUserRoles] No projects found');
        return [];
    }

    const project = user.projects.find(
        (p) => p.projectName?.toLowerCase() === TARGET_PROJECT.toLowerCase()
    );

    if (!project) {
        console.log(`[extractUserRoles] Project "${TARGET_PROJECT}" not found`);
        return [];
    }

    const roles = project.roles || [];
    console.log(`[extractUserRoles] ${TARGET_PROJECT} roles:`, roles);
    return roles;
};

// ==================== INITIAL STATE ====================

/**
 * getInitialState - Cookie ve localStorage'dan initial state oluştur
 *
 * ✅ FIX: Sayfa yenilemede state korunuyor
 */
const getInitialState = () => {
    console.log('🔄 getInitialState çalışıyor...');

    // 1. Cookie'den oku
    const authCookie = readAuthCookieInline();

    // 2. localStorage'dan token oku (backup)
    const localToken = typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.TOKEN)
        : null;

    // 3. Token var mı kontrol et
    const token = authCookie?.authToken || localToken || null;
    const hasValidAuth = !!(token && (authCookie?.authenticateResult !== false));

    console.log('📋 Initial state debug:');
    console.log('   ├─ Cookie token:', authCookie?.authToken ? 'VAR' : 'YOK');
    console.log('   ├─ localStorage token:', localToken ? 'VAR' : 'YOK');
    console.log('   ├─ Final token:', token ? 'VAR' : 'YOK');
    console.log('   └─ hasValidAuth:', hasValidAuth);

    // 4. User bilgisini al ve rolleri ekle
    let user = authCookie?.user || null;
    if (user) {
        user = {
            ...user,
            roles: extractUserRoles(user)
        };
    }

    // 5. State döndür
    // ✅ ÖNEMLİ: Token varsa initialized TRUE olmalı
    // Bu sayede ProtectedRoute hemen loading göstermek yerine auth kontrolü yapabilir
    return {
        user: user,
        token: token,
        isAuthenticated: hasValidAuth,
        loading: false,
        error: null,
        initialized: hasValidAuth, // ✅ Token varsa initialized true
    };
};

const initialState = getInitialState();

// ==================== ASYNC THUNKS ====================

/**
 * validateAndLoadUser - Token'ı validate et ve user bilgilerini yükle
 */
export const validateAndLoadUser = createAsyncThunk(
    'auth/validateAndLoadUser',
    async (_, { rejectWithValue, getState }) => {
        try {
            // Mevcut state'i kontrol et
            const currentState = getState().auth;

            // Zaten authenticated ve user varsa skip et
            if (currentState.isAuthenticated && currentState.user && currentState.token) {
                console.log('✅ Already authenticated, skipping validation');
                return {
                    user: currentState.user,
                    token: currentState.token,
                };
            }

            // Cookie'den token al
            const authCookie = readAuthCookieInline();
            const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const token = authCookie?.authToken || localToken;

            if (!token) {
                console.log('ℹ️ No token found, skipping validation');
                return null;
            }

            console.log('🔄 Validating token...');

            // Token'ı validate et
            const validateResult = await authService.validateToken(token);

            if (validateResult) {
                const roles = extractUserRoles(validateResult);
                const userWithRoles = {
                    ...validateResult,
                    roles: roles
                };

                console.log('✅ Token validated successfully');

                return {
                    user: userWithRoles,
                    token: token,
                };
            }

            // Validate başarısız - cookie'deki bilgileri kullan
            console.warn('⚠️ Validate failed, using cached data');

            if (authCookie?.user) {
                const user = authCookie.user;
                const roles = extractUserRoles(user);

                return {
                    user: { ...user, roles },
                    token: token,
                };
            }

            return null;
        } catch (error) {
            console.error('❌ validateAndLoadUser error:', error);
            // Hata olsa bile mevcut cookie verilerini kullan
            const authCookie = readAuthCookieInline();
            if (authCookie?.authToken && authCookie?.user) {
                return {
                    user: { ...authCookie.user, roles: extractUserRoles(authCookie.user) },
                    token: authCookie.authToken,
                };
            }
            return rejectWithValue(error.message || 'Initialization failed');
        }
    }
);

/**
 * login - Kullanıcı giriş işlemi
 */
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            console.log('✅ Login successful');

            if (response && response.user) {
                const roles = extractUserRoles(response.user);
                response.user = {
                    ...response.user,
                    roles: roles
                };
            }

            return response;
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

/**
 * logout - Kullanıcı çıkış işlemi
 */
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
            console.log('✅ Logout successful');
            return null;
        } catch (error) {
            console.error('❌ Logout failed:', error.message);
            return null;
        }
    }
);

/**
 * refreshToken - Token yenileme
 */
export const refreshToken = createAsyncThunk(
    'auth/refresh',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.refreshToken();
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Token refresh failed');
        }
    }
);

// ==================== SLICE ====================

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            const user = action.payload;
            const roles = extractUserRoles(user);

            state.user = { ...user, roles };
            state.isAuthenticated = true;
            state.initialized = true;
        },

        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            state.loading = false;
            state.initialized = true;

            // Cookie ve localStorage temizle
            document.cookie = 'authUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
        },

        setTokenFromCookie: (state) => {
            const authCookie = readAuthCookieInline();
            if (authCookie?.authToken) {
                const user = authCookie.user || {};
                const roles = extractUserRoles(user);

                state.token = authCookie.authToken;
                state.user = { ...user, roles };
                state.isAuthenticated = true;
                state.initialized = true;
            }
        },

        setInitialized: (state, action) => {
            state.initialized = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // validateAndLoadUser
            .addCase(validateAndLoadUser.pending, (state) => {
                // ✅ FIX: Eğer zaten authenticated ise loading gösterme
                if (!state.isAuthenticated) {
                    state.loading = true;
                }
            })
            .addCase(validateAndLoadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.initialized = true;

                if (action.payload) {
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.isAuthenticated = true;
                }
                // ✅ FIX: payload null olsa bile mevcut state'i koru
                // Sadece açıkça null dönerse logout yap
            })
            .addCase(validateAndLoadUser.rejected, (state, action) => {
                state.loading = false;
                state.initialized = true;
                state.error = action.payload;
                // ✅ FIX: Hata olsa bile mevcut auth durumunu koru
                // Sadece token yoksa logout yap
                if (!state.token) {
                    state.isAuthenticated = false;
                }
            })

            // login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.initialized = true;

                if (action.payload) {
                    state.user = action.payload.user;
                    state.token = action.payload.accessToken;
                    state.isAuthenticated = true;
                    state.error = null;
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.initialized = true;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // logout
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.loading = false;
                state.initialized = true;
                state.error = null;
            })
            .addCase(logout.rejected, (state) => {
                // Hata olsa bile logout yap
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.loading = false;
                state.initialized = true;
            })

            // refreshToken
            .addCase(refreshToken.fulfilled, (state, action) => {
                if (action.payload?.token) {
                    state.token = action.payload.token;
                }
            });
    },
});

// ==================== EXPORTS ====================

export const { setUser, clearAuth, setTokenFromCookie, setInitialized } = authSlice.actions;

export default authSlice.reducer;