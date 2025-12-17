import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import trTR from 'antd/locale/tr_TR'

import { store } from './store'
import App from './App'
import './translations/i18n'
import './index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ConfigProvider locale={trTR}>
                    <App />
                </ConfigProvider>
            </QueryClientProvider>
        </Provider>
)