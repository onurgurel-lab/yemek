/**
 * Uygulama Yapılandırma Sabitleri
 *
 * Uygulama genelinde kullanılan sabit değerleri ve yapılandırmaları içerir.
 * Environment değişkenlerinden ayarları okur ve varsayılan değerler sağlar.
 */

/**
 * APP_CONFIG - Genel uygulama ayarları
 *
 * Uygulama adı, versiyon, çevre, dil ve tarih formatı gibi
 * temel yapılandırma bilgilerini içerir.
 */
export const APP_CONFIG = {
    NAME: import.meta.env.VITE_APP_NAME || 'Doku Gate',        // Uygulama adı
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',      // Uygulama versiyonu
    ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development', // Çalışma ortamı (dev, prod, test)
    DEFAULT_LANGUAGE: 'en',                                    // Varsayılan dil (Türkçe)
    SUPPORTED_LANGUAGES: ['tr', 'en'],                         // Desteklenen diller (Türkçe, İngilizce)
    DATE_FORMAT: 'DD.MM.YYYY',                                 // Tarih formatı (Gün.Ay.Yıl)
    TIME_FORMAT: 'HH:mm',                                      // Saat formatı (Saat:Dakika)
    DATETIME_FORMAT: 'DD.MM.YYYY HH:mm',                       // Tarih-saat formatı
}

/**
 * STORAGE_KEYS - LocalStorage ve Cookie key'leri
 *
 * Tarayıcı storage'ında (localStorage, sessionStorage, cookies)
 * veri saklamak için kullanılan key isimleri.
 * Merkezi tanımlama ile typo hatalarını önler ve yönetimi kolaylaştırır.
 */
export const STORAGE_KEYS = {
    TOKEN: 'access_token',           // Erişim token'ı (JWT)
    REFRESH_TOKEN: 'refresh_token',  // Yenileme token'ı
    USER: 'user',                    // Kullanıcı bilgileri objesi
    LANGUAGE: 'language',            // Seçili dil tercihi
    THEME: 'theme',                  // Tema tercihi (light/dark)
    AUTH_COOKIE: 'authUser',         // Kimlik doğrulama cookie'si
}