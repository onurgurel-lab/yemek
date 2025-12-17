import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { exampleService } from '@/services/example'

const initialState = {
    examples: [],
    currentExample: null,
    loading: false,
    error: null,
    // Pagination data
    totalRecords: 0,
    pageNumber: 1,
    pageSize: 30,
    totalPages: 0,
    // Filters
    filters: {
        search: '',
        status: 'all',
    },
}

export const fetchExamples = createAsyncThunk(
    'example/fetchExamples',
    async (params, { rejectWithValue }) => {
        try {
            const response = await exampleService.getExamples(params)
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

export const createExample = createAsyncThunk(
    'example/createExample',
    async (data, { rejectWithValue }) => {
        try {
            const response = await exampleService.createExample(data)
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

export const updateExample = createAsyncThunk(
    'example/updateExample',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await exampleService.updateExample(id, data)
            return response
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

export const deleteExample = createAsyncThunk(
    'example/deleteExample',
    async (id, { rejectWithValue }) => {
        try {
            await exampleService.deleteExample(id)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message)
        }
    }
)

const exampleSlice = createSlice({
    name: 'example',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
        },
        clearFilters: (state) => {
            state.filters = initialState.filters
        },
        setCurrentExample: (state, action) => {
            state.currentExample = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch examples
            .addCase(fetchExamples.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchExamples.fulfilled, (state, action) => {
                state.loading = false
                // API response contains both data array and pagination info
                state.examples = action.payload.data || []
                state.totalRecords = action.payload.totalRecords || 0
                state.pageNumber = action.payload.pageNumber || 1
                state.pageSize = action.payload.pageSize || 30
                state.totalPages = action.payload.totalPages || 0
            })
            .addCase(fetchExamples.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Create example
            .addCase(createExample.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createExample.fulfilled, (state, action) => {
                state.loading = false
                // Don't add to local state, instead refetch the current page
                // This will be handled in the component
            })
            .addCase(createExample.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Update example
            .addCase(updateExample.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateExample.fulfilled, (state, action) => {
                state.loading = false
                // Update in local state if exists
                const index = state.examples.findIndex(ex => ex.id === action.payload.id)
                if (index !== -1) {
                    state.examples[index] = action.payload
                }
            })
            .addCase(updateExample.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Delete example
            .addCase(deleteExample.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteExample.fulfilled, (state, action) => {
                state.loading = false
                // Remove from local state
                state.examples = state.examples.filter(ex => ex.id !== action.payload)
                // Decrease totalRecords count
                if (state.totalRecords > 0) {
                    state.totalRecords -= 1
                }
            })
            .addCase(deleteExample.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { setFilters, clearFilters, setCurrentExample } = exampleSlice.actions
export default exampleSlice.reducer