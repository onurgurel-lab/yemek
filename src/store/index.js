import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import exampleReducer from './slices/exampleSlice'
import lookupReducer from './slices/lookupSlice'
import yemekhaneReducer from './slices/yemekhaneSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        example: exampleReducer,
        yemekhane: yemekhaneReducer,
        lookup: lookupReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/login/fulfilled', 'auth/logout/fulfilled'],
            },
        }),
    devTools: import.meta.env.DEV,
})

export default store