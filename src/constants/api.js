/**
 * API Yapilandirma Dosyasi
 *
 * Tum API endpoint'lerini, yapilandirma ayarlarini ve HTTP durum kodlarini
 * merkezi bir yerden yonetir. Environment degiskenlerinden API URL'lerini alir.
 */

// Environment degiskenlerinden API URL'lerini al
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://umapi.dokuclinic.com/api'
const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL || 'https://umapi.dokuclinic.com/api/Auth/login'
const API_USER_URL = import.meta.env.VITE_API_USER_VALIDATE_URL || 'https://umapi.dokuclinic.com/api/Auth/validate'


// User Management API URL - Kullanici listesi icin (farkli domain)
const API_USER_MANAGEMENT_URL = 'https://umapi.dokugate.com/api'

/**
 * API_ENDPOINTS - Tum API endpoint URL'lerini iceren obje
 *
 * Uygulamada kullanilan tum API yollarini merkezi olarak tanimlar.
 * Dinamik endpoint'ler icin fonksiyon kullanir (id parametreli olanlar).
 */
export const API_ENDPOINTS = {
    // ==========================================
    // Kimlik dogrulama (authentication) endpoint'leri
    // ==========================================
    LOGIN: API_LOGIN_URL,                             // Kullanici giris endpoint'i
    VALIDATE: `${API_USER_URL}`,                      // Token dogrulama endpoint'i
    LOGOUT: `${API_BASE_URL}/auth/logout`,            // Kullanici cikis endpoint'i
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,    // Token yenileme endpoint'i
    VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,      // Token kontrol endpoint'i


    // ==========================================
    // Ornek CRUD (Create, Read, Update, Delete) endpoint'leri
    // ==========================================
    GET_EXAMPLES: '/postop/list',                     // Tum ornekleri listele
    GET_EXAMPLE: (id) => `/examples/${id}`,           // Tek ornegi getir (ID ile)
    CREATE_EXAMPLE: '/examples',                      // Yeni ornek olustur
    UPDATE_EXAMPLE: (id) => `/examples/${id}`,        // Ornegi guncelle (ID ile)
    DELETE_EXAMPLE: (id) => `/examples/${id}`,        // Ornegi sil (ID ile)
    DELETE_MULTIPLE_EXAMPLES: '/examples/bulk-delete', // Toplu silme
    EXPORT_EXAMPLES: '/examples/export',              // Ornekleri disa aktar

    // ==========================================
    // Lookup (Referans Verileri) endpoint'leri
    // ==========================================
    GET_COUNTRIES: '/Country',                        // Ulke listesi
    GET_HOTELS: '/Hotel',                             // Otel listesi
    GET_AIRLINES: '/Airline',                         // Havayolu listesi
    GET_USERS: `${API_USER_MANAGEMENT_URL}/User/get-all`, // Kullanici listesi (doktor, danisman)
}

/**
 * API_CONFIG - API istekleri icin genel yapilandirma ayarlari
 *
 * Timeout, retry (yeniden deneme) ve temel URL ayarlarini icerir.
 */
export const API_CONFIG = {
    BASE_URL: API_BASE_URL,           // Ana API URL'i
    LOGIN_URL: API_LOGIN_URL,         // Login API URL'i (farkli domain olabilir)
    USER_MANAGEMENT_URL: API_USER_MANAGEMENT_URL, // User Management API URL'i
    TIMEOUT: 30000,                   // Istek zaman asimi suresi (30 saniye)
    RETRY_ATTEMPTS: 3,                // Basarisiz istekte yeniden deneme sayisi
    RETRY_DELAY: 1000,                // Yeniden denemeler arasi bekleme suresi (1 saniye)
}

/**
 * HTTP_STATUS - Yaygin kullanilan HTTP durum kodlari
 *
 * API response'larini kontrol ederken kullanilir.
 * Magic number kullanimini onler ve kodun okunabilirligini artirir.
 */
export const HTTP_STATUS = {
    OK: 200,                     // Basarili istek
    CREATED: 201,                // Kaynak basariyla olusturuldu
    BAD_REQUEST: 400,            // Hatali istek
    UNAUTHORIZED: 401,           // Yetkisiz erisim (giris gerekli)
    FORBIDDEN: 403,              // Yasak (yetkisiz islem)
    NOT_FOUND: 404,              // Kaynak bulunamadi
    INTERNAL_SERVER_ERROR: 500,  // Sunucu hatasi
}