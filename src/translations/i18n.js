import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { APP_CONFIG, STORAGE_KEYS } from '@/constants/config'

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: APP_CONFIG.DEFAULT_LANGUAGE,
        debug: APP_CONFIG.ENVIRONMENT === 'development',

        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false,
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        ns: ['translation'],
        defaultNS: 'translation',

        react: {
            useSuspense: false,
        },
    })

export default i18n