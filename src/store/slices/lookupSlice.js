import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { lookupService } from '@/services/lookup'

/**
 * Lookup Initial State
 * Referans verileri (ulke, otel, havayolu, kullanici) icin state
 */
const initialState = {
    // Ulke state
    countries: [],
    countriesLoading: false,
    countriesError: null,
    countriesLoaded: false, // Bir kez yuklendikten sonra tekrar yuklememek icin

    // Otel state
    hotels: [],
    hotelsLoading: false,
    hotelsError: null,
    hotelsLoaded: false,

    // Havayolu state
    airlines: [],
    airlinesLoading: false,
    airlinesError: null,
    airlinesLoaded: false,

    // Kullanici state (doktor ve satis danismani icin ortak)
    users: [],
    usersLoading: false,
    usersError: null,
    usersLoaded: false,
}

/**
 * fetchCountries - Ulke listesini getir
 * API Endpoint: GET /api/Country
 */
export const fetchCountries = createAsyncThunk(
    'lookup/fetchCountries',
    async (_, { getState, rejectWithValue }) => {
        try {
            // Eger daha once yuklendiyse tekrar yukleme
            const { lookup } = getState()
            if (lookup.countriesLoaded && lookup.countries.length > 0) {
                return lookup.countries
            }

            const response = await lookupService.getCountries()
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

/**
 * fetchHotels - Otel listesini getir
 * API Endpoint: GET /api/Hotel
 */
export const fetchHotels = createAsyncThunk(
    'lookup/fetchHotels',
    async (_, { getState, rejectWithValue }) => {
        try {
            // Eger daha once yuklendiyse tekrar yukleme
            const { lookup } = getState()
            if (lookup.hotelsLoaded && lookup.hotels.length > 0) {
                return lookup.hotels
            }

            const response = await lookupService.getHotels()
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

/**
 * fetchAirlines - Havayolu listesini getir
 * API Endpoint: GET /api/Airline
 */
export const fetchAirlines = createAsyncThunk(
    'lookup/fetchAirlines',
    async (_, { getState, rejectWithValue }) => {
        try {
            // Eger daha once yuklendiyse tekrar yukleme
            const { lookup } = getState()
            if (lookup.airlinesLoaded && lookup.airlines.length > 0) {
                return lookup.airlines
            }

            const response = await lookupService.getAirlines()
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

/**
 * fetchUsers - Kullanici listesini getir (Doktor ve Satis Danismani icin)
 * API Endpoint: GET https://umapi.dokugate.com/api/User/get-all
 */
export const fetchUsers = createAsyncThunk(
    'lookup/fetchUsers',
    async (_, { getState, rejectWithValue }) => {
        try {
            // Eger daha once yuklendiyse tekrar yukleme
            const { lookup } = getState()
            if (lookup.usersLoaded && lookup.users.length > 0) {
                return lookup.users
            }

            const response = await lookupService.getUsers({
                pageNumber: 1,
                pageSize: 1000
            })
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

/**
 * fetchAllLookups - Tum referans verilerini tek seferde getir
 * Modal acildiginda kullanilabilir
 */
export const fetchAllLookups = createAsyncThunk(
    'lookup/fetchAllLookups',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // Paralel olarak tum verileri getir
            await Promise.all([
                dispatch(fetchCountries()),
                dispatch(fetchHotels()),
                dispatch(fetchUsers())
            ])
            return true
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

/**
 * Lookup Slice
 */
const lookupSlice = createSlice({
    name: 'lookup',
    initialState,
    reducers: {
        /**
         * clearCountries - Ulke listesini temizle
         */
        clearCountries: (state) => {
            state.countries = []
            state.countriesError = null
            state.countriesLoaded = false
        },
        /**
         * clearHotels - Otel listesini temizle
         */
        clearHotels: (state) => {
            state.hotels = []
            state.hotelsError = null
            state.hotelsLoaded = false
        },
        /**
         * clearAirlines - Havayolu listesini temizle
         */
        clearAirlines: (state) => {
            state.airlines = []
            state.airlinesError = null
            state.airlinesLoaded = false
        },
        /**
         * clearUsers - Kullanici listesini temizle
         */
        clearUsers: (state) => {
            state.users = []
            state.usersError = null
            state.usersLoaded = false
        },
        /**
         * clearAllLookups - Tum referans verilerini temizle
         */
        clearAllLookups: (state) => {
            state.countries = []
            state.countriesError = null
            state.countriesLoaded = false

            state.hotels = []
            state.hotelsError = null
            state.hotelsLoaded = false

            state.airlines = []
            state.airlinesError = null
            state.airlinesLoaded = false

            state.users = []
            state.usersError = null
            state.usersLoaded = false
        },
        /**
         * resetLoaded - Loaded flaglerini sifirla (yeniden yukleme icin)
         */
        resetLoaded: (state) => {
            state.countriesLoaded = false
            state.hotelsLoaded = false
            state.airlinesLoaded = false
            state.usersLoaded = false
        }
    },
    extraReducers: (builder) => {
        builder
            // ==========================================
            // Fetch Countries - Ulke listesi
            // ==========================================
            .addCase(fetchCountries.pending, (state) => {
                state.countriesLoading = true
                state.countriesError = null
            })
            .addCase(fetchCountries.fulfilled, (state, action) => {
                state.countriesLoading = false
                state.countries = Array.isArray(action.payload) ? action.payload : []
                state.countriesLoaded = true
            })
            .addCase(fetchCountries.rejected, (state, action) => {
                state.countriesLoading = false
                state.countriesError = action.payload
                state.countriesLoaded = false
            })

            // ==========================================
            // Fetch Hotels - Otel listesi
            // ==========================================
            .addCase(fetchHotels.pending, (state) => {
                state.hotelsLoading = true
                state.hotelsError = null
            })
            .addCase(fetchHotels.fulfilled, (state, action) => {
                state.hotelsLoading = false
                state.hotels = Array.isArray(action.payload) ? action.payload : []
                state.hotelsLoaded = true
            })
            .addCase(fetchHotels.rejected, (state, action) => {
                state.hotelsLoading = false
                state.hotelsError = action.payload
                state.hotelsLoaded = false
            })

            // ==========================================
            // Fetch Airlines - Havayolu listesi
            // ==========================================
            .addCase(fetchAirlines.pending, (state) => {
                state.airlinesLoading = true
                state.airlinesError = null
            })
            .addCase(fetchAirlines.fulfilled, (state, action) => {
                state.airlinesLoading = false
                state.airlines = Array.isArray(action.payload) ? action.payload : []
                state.airlinesLoaded = true
            })
            .addCase(fetchAirlines.rejected, (state, action) => {
                state.airlinesLoading = false
                state.airlinesError = action.payload
                state.airlinesLoaded = false
            })

            // ==========================================
            // Fetch Users - Kullanici listesi
            // ==========================================
            .addCase(fetchUsers.pending, (state) => {
                state.usersLoading = true
                state.usersError = null
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.usersLoading = false
                state.users = Array.isArray(action.payload) ? action.payload : []
                state.usersLoaded = true
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.usersLoading = false
                state.usersError = action.payload
                state.usersLoaded = false
            })
    },
})

// Actions
export const {
    clearCountries,
    clearHotels,
    clearAirlines,
    clearUsers,
    clearAllLookups,
    resetLoaded,
} = lookupSlice.actions

// ==========================================
// Selectors
// ==========================================

// Ulke selectors
export const selectCountries = (state) => state.lookup.countries
export const selectCountriesLoading = (state) => state.lookup.countriesLoading
export const selectCountriesError = (state) => state.lookup.countriesError

// Otel selectors
export const selectHotels = (state) => state.lookup.hotels
export const selectHotelsLoading = (state) => state.lookup.hotelsLoading
export const selectHotelsError = (state) => state.lookup.hotelsError

// Havayolu selectors
export const selectAirlines = (state) => state.lookup.airlines
export const selectAirlinesLoading = (state) => state.lookup.airlinesLoading
export const selectAirlinesError = (state) => state.lookup.airlinesError

// Kullanici selectors
export const selectUsers = (state) => state.lookup.users
export const selectUsersLoading = (state) => state.lookup.usersLoading
export const selectUsersError = (state) => state.lookup.usersError

// Derived selectors - Doktorlar (sadece aktif kullanıcılar)
export const selectDoctors = (state) => {
    const users = state.lookup.users
    // Sadece aktif kullanıcıları filtrele
    return users.filter(u => u.status === 'Active')
}

// Derived selectors - Satis Danismanlari (sadece aktif kullanıcılar)
export const selectSalesConsultants = (state) => {
    const users = state.lookup.users
    // Sadece aktif kullanıcıları filtrele
    return users.filter(u => u.status === 'Active')
}

// Loading selectors
export const selectAnyLoading = (state) =>
    state.lookup.countriesLoading ||
    state.lookup.hotelsLoading ||
    state.lookup.airlinesLoading ||
    state.lookup.usersLoading

export default lookupSlice.reducer