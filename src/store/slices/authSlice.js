import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '@/services/auth'
import { cookieUtils } from '@/utils/cookies'

/**
 * Initial state'i cookie'den al
 */
const getInitialState = () => {
    const authCookie = cookieUtils.getAuthCookie()
    const isAuthenticated = !!(authCookie?.authToken && authCookie?.authenticateResult)

    return {
        user: authCookie?.user || null,
        token: authCookie?.authToken || null,
        isAuthenticated,
        loading: false,
        error: null,
        initialized: false,
    }
}

const initialState = getInitialState()

/**
 * validateAndLoadUser - Cookie'deki token'ı validate et
 * ✅ Sadece 1 kere validate çağrılacak
 */
export const validateAndLoadUser = createAsyncThunk(
    'auth/validateAndLoadUser',
    async (_, { rejectWithValue }) => {
        try {
            const authCookie = cookieUtils.getAuthCookie()

            if (!authCookie || !authCookie.authToken) {
                console.log('ℹ️ No token in cookie, skipping validation')
                return null
            }

            console.log('🔄 Validating token from cookie...')

            // Token'ı validate et
            const validateResult = await authService.validateToken(authCookie.authToken)

            if (validateResult) {
                console.log('✅ Token validated successfully')

                // Cookie'deki user bilgisini güncelle
                cookieUtils.setAuthCookie({
                    ...authCookie,
                    user: validateResult
                })

                return {
                    user: validateResult,
                    token: authCookie.authToken,
                }
            }

            // Validate başarısız - cookie'deki bilgileri kullan
            console.warn('⚠️ Validate failed, using cookie data')
            return {
                user: authCookie.user,
                token: authCookie.authToken,
            }
        } catch (error) {
            console.error('❌ Critical error in validateAndLoadUser:', error)
            return rejectWithValue(error.message || 'Initialization failed')
        }
    }
)

/**
 * login - Kullanıcı giriş işlemi
 * ✅ Login'de VALIDATE ATMIYORUZ artık
 */
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials)
            console.log('✅ Login successful')
            return response
        } catch (error) {
            console.error('❌ Login failed:', error.message)
            return rejectWithValue(error.message || 'Login failed')
        }
    }
)

/**
 * logout - Kullanıcı çıkış işlemi
 */
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout()
            console.log('✅ Logout successful')
            return null
        } catch (error) {
            console.error('❌ Logout failed:', error.message)
            return rejectWithValue(error.message || 'Logout failed')
        }
    }
)

/**
 * refreshToken - Token yenileme
 */
export const refreshToken = createAsyncThunk(
    'auth/refresh',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.refreshToken()
            return response
        } catch (error) {
            return rejectWithValue(error.message || 'Token refresh failed')
        }
    }
)

/**
 * checkTokenExpiry - Token süresi kontrolü
 */
export const checkTokenExpiry = createAsyncThunk(
    'auth/checkExpiry',
    async (_, { getState, dispatch }) => {
        const state = getState()
        const token = state.auth.token

        if (token) {
            const decoded = authService.decodeToken(token)
            if (decoded && decoded.exp) {
                const expiryTime = decoded.exp * 1000
                const currentTime = Date.now()

                if (currentTime >= expiryTime) {
                    console.warn('⚠️ Token expired, logging out...')
                    dispatch(logout())
                    return false
                }
                return true
            }
        }
        return false
    }
)

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload

            // Cookie'yi güncelle
            const authCookie = cookieUtils.getAuthCookie()
            if (authCookie) {
                cookieUtils.setAuthCookie({
                    ...authCookie,
                    user: action.payload
                })
            }
        },
        clearAuth: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = null
            state.initialized = false
            cookieUtils.clearAuthCookie()
        },
        setTokenFromCookie: (state) => {
            const authCookie = cookieUtils.getAuthCookie()
            if (authCookie && authCookie.authToken) {
                state.token = authCookie.authToken
                state.user = authCookie.user || null
                state.isAuthenticated = true
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // validateAndLoadUser
            .addCase(validateAndLoadUser.pending, (state) => {
                state.loading = true
            })
            .addCase(validateAndLoadUser.fulfilled, (state, action) => {
                state.loading = false
                state.initialized = true

                if (action.payload) {
                    state.user = action.payload.user
                    state.token = action.payload.token
                    state.isAuthenticated = true
                } else {
                    state.user = null
                    state.token = null
                    state.isAuthenticated = false
                }
            })
            .addCase(validateAndLoadUser.rejected, (state, action) => {
                state.loading = false
                state.initialized = true

                // Hata olsa bile cookie'deki bilgileri koru
                const authCookie = cookieUtils.getAuthCookie()
                if (authCookie && authCookie.authToken) {
                    state.user = authCookie.user || null
                    state.token = authCookie.authToken
                    state.isAuthenticated = true
                } else {
                    state.user = null
                    state.token = null
                    state.isAuthenticated = false
                }
                state.error = action.payload
            })

            // Login
            .addCase(login.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false
                state.isAuthenticated = true
                state.user = action.payload.user
                state.token = action.payload.accessToken
                state.error = null
                state.initialized = true
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
                state.isAuthenticated = false
            })

            // Logout
            .addCase(logout.pending, (state) => {
                state.loading = true
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.error = null
                state.initialized = false
            })
            .addCase(logout.rejected, (state) => {
                state.loading = false
                // Hata olsa bile çıkış yap
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.initialized = false
                cookieUtils.clearAuthCookie()
            })

            // Refresh Token
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.token = action.payload.accessToken
            })
            .addCase(refreshToken.rejected, (state) => {
                state.user = null
                state.token = null
                state.isAuthenticated = false
                cookieUtils.clearAuthCookie()
            })
    },
})

export const { setUser, clearAuth, setTokenFromCookie } = authSlice.actions

// ✅ Selectors - Component'lerden kolayca erişim için
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectUserProjects = (state) => state.auth.user?.projects || []

// ✅ Kullanıcının belirli bir projedeki rollerini döndürür
export const selectUserRolesForProject = (projectName) => (state) => {
    const projects = state.auth.user?.projects || []
    const project = projects.find(p => p.projectName === projectName)
    return project?.roles || []
}

// ✅ Kullanıcının belirli bir rolü olup olmadığını kontrol eder
export const selectHasRole = (projectName, roleName) => (state) => {
    const projects = state.auth.user?.projects || []
    const project = projects.find(p => p.projectName === projectName)
    return project?.roles?.includes(roleName) || false
}

export default authSlice.reducer