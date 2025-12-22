/**
 * authSlice.js - Authentication Redux Slice
 *
 * Login, logout ve validate işlemlerini yönetir.
 * User objesine hedef projenin rollerini ekler.
 *
 * @module store/slices/authSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/auth';
import { cookieUtils } from '@/utils/cookies';

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

/**
 * extractUserRoles - Kullanıcının hedef projedeki rollerini çıkarır
 * @param {Object} user - Kullanıcı objesi
 * @returns {string[]} Roller dizisi
 */
const extractUserRoles = (user) => {
    if (!user?.projects || !Array.isArray(user.projects)) {
        console.log('[extractUserRoles] No projects found, user:', user);
        return [];
    }

    const project = user.projects.find(
        (p) => p.projectName?.toLowerCase() === TARGET_PROJECT.toLowerCase()
    );

    if (!project) {
        console.log(`[extractUserRoles] Project "${TARGET_PROJECT}" not found in:`, user.projects);
        return [];
    }

    const roles = project.roles || [];
    console.log(`[extractUserRoles] ${TARGET_PROJECT} roles:`, roles);
    return roles;
};

/**
 * getInitialState - Cookie'den initial state oluştur
 */
const getInitialState = () => {
    const authCookie = cookieUtils.getAuthCookie();
    const isAuthenticated = !!(authCookie?.authToken && authCookie?.authenticateResult);

    // Cookie'deki user'a rolleri ekle
    let user = authCookie?.user || null;
    if (user) {
        user = {
            ...user,
            roles: extractUserRoles(user)
        };
    }

    return {
        user: user,
        token: authCookie?.authToken || null,
        isAuthenticated,
        loading: false,
        error: null,
        initialized: false,
    };
};

const initialState = getInitialState();

// ==================== ASYNC THUNKS ====================

/**
 * validateAndLoadUser - Cookie'deki token'ı validate et
 */
export const validateAndLoadUser = createAsyncThunk(
    'auth/validateAndLoadUser',
    async (_, { rejectWithValue }) => {
        try {
            const authCookie = cookieUtils.getAuthCookie();

            if (!authCookie || !authCookie.authToken) {
                console.log('ℹ️ No token in cookie, skipping validation');
                return null;
            }

            console.log('🔄 Validating token from cookie...');

            // Token'ı validate et
            const validateResult = await authService.validateToken(authCookie.authToken);

            if (validateResult) {
                // Rolleri ekle
                const roles = extractUserRoles(validateResult);
                const userWithRoles = {
                    ...validateResult,
                    roles: roles
                };

                console.log('✅ Token validated successfully');
                console.log('📋 User roles:', roles);

                // Cookie'deki user bilgisini güncelle
                cookieUtils.setAuthCookie({
                    ...authCookie,
                    user: userWithRoles
                });

                return {
                    user: userWithRoles,
                    token: authCookie.authToken,
                };
            }

            // Validate başarısız - cookie'deki bilgileri kullan
            console.warn('⚠️ Validate failed, using cookie data');

            const user = authCookie.user || {};
            const roles = extractUserRoles(user);

            return {
                user: {
                    ...user,
                    roles: roles
                },
                token: authCookie.authToken,
            };
        } catch (error) {
            console.error('❌ Critical error in validateAndLoadUser:', error);
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
            console.log('✅ Login thunk response:', response);
            console.log('📋 User from login:', response?.user);

            // User'a rolleri ekle
            if (response && response.user) {
                const roles = extractUserRoles(response.user);
                response.user = {
                    ...response.user,
                    roles: roles
                };
                console.log('📋 Login user with roles:', response.user);
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
            // Hata olsa bile logout yap
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

/**
 * checkTokenExpiry - Token süresi kontrolü
 */
export const checkTokenExpiry = createAsyncThunk(
    'auth/checkExpiry',
    async (_, { getState, dispatch }) => {
        const state = getState();
        const token = state.auth.token;

        if (token) {
            const decoded = authService.decodeToken(token);
            if (decoded && decoded.exp) {
                const expiryTime = decoded.exp * 1000;
                const currentTime = Date.now();

                if (currentTime >= expiryTime) {
                    console.warn('⚠️ Token expired, logging out...');
                    dispatch(logout());
                    return false;
                }
                return true;
            }
        }
        return false;
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

            state.user = {
                ...user,
                roles: roles
            };
            state.isAuthenticated = true;
            state.initialized = true;

            // Cookie'yi güncelle
            const authCookie = cookieUtils.getAuthCookie();
            if (authCookie) {
                cookieUtils.setAuthCookie({
                    ...authCookie,
                    user: state.user
                });
            }
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            state.loading = false;
            // IMPORTANT: initialized TRUE kalmalı ki login sayfasına yönlenebilsin
            state.initialized = true;
            cookieUtils.clearAuthCookie();
        },
        setTokenFromCookie: (state) => {
            const authCookie = cookieUtils.getAuthCookie();
            if (authCookie && authCookie.authToken) {
                const user = authCookie.user || {};
                const roles = extractUserRoles(user);

                state.token = authCookie.authToken;
                state.user = {
                    ...user,
                    roles: roles
                };
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
                state.loading = true;
            })
            .addCase(validateAndLoadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.initialized = true;

                if (action.payload) {
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.isAuthenticated = true;
                } else {
                    state.user = null;
                    state.token = null;
                    state.isAuthenticated = false;
                }
            })
            .addCase(validateAndLoadUser.rejected, (state, action) => {
                state.loading = false;
                state.initialized = true;
                state.error = action.payload;
                state.isAuthenticated = false;
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
                    // User zaten rolleri içeriyor (thunk'ta eklendi)
                    state.user = action.payload.user;
                    state.token = action.payload.accessToken;
                    state.isAuthenticated = true;
                    state.error = null;

                    console.log('🔄 Redux state updated - user:', state.user);
                    console.log('🔄 Redux state updated - roles:', state.user?.roles);
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
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
                // IMPORTANT: Logout sonrası initialized TRUE kalmalı
                state.initialized = true;
            })
            .addCase(logout.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
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

// ==================== ACTIONS ====================

export const { setUser, clearAuth, setTokenFromCookie, setInitialized } = authSlice.actions;

// ==================== SELECTORS ====================

export const selectUser = (state) => state.auth.user;
export const selectUserRoles = (state) => state.auth.user?.roles || [];
export const selectUserProjects = (state) => state.auth.user?.projects || [];
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsInitialized = (state) => state.auth.initialized;

export const selectIsAdmin = (state) => {
    const roles = selectUserRoles(state);
    return roles.includes('Admin');
};

export const selectIsRaporAdmin = (state) => {
    const roles = selectUserRoles(state);
    return roles.includes('RaporAdmin');
};

export const selectCanViewReports = (state) => {
    return selectIsAdmin(state) || selectIsRaporAdmin(state);
};

export const selectHasRole = (role) => (state) => {
    const roles = selectUserRoles(state);
    return roles.includes(role);
};

export const selectUserRolesForProject = (projectName) => (state) => {
    const projects = selectUserProjects(state);
    const project = projects.find(
        (p) => p.projectName?.toLowerCase() === projectName?.toLowerCase()
    );
    return project?.roles || [];
};

export default authSlice.reducer;