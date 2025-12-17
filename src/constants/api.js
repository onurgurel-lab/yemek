/**
 * API Yapılandırma Dosyası
 *
 * Tüm API endpoint'lerini, yapılandırma ayarlarını ve HTTP durum kodlarını
 * merkezi bir yerden yönetir. Environment değişkenlerinden API URL'lerini alır.
 */

// Environment değişkenlerinden API URL'lerini al
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://umapi.dokuclinic.com/api';
const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL || 'https://umapi.dokuclinic.com/api/Auth/login';
const API_USER_URL = import.meta.env.VITE_API_USER_VALIDATE_URL || 'https://umapi.dokuclinic.com/api/Auth/validate';

// User Management API URL - Kullanıcı listesi için (farklı domain)
const API_USER_MANAGEMENT_URL = 'https://umapi.dokugate.com/api';

/**
 * API_ENDPOINTS - Tüm API endpoint URL'lerini içeren obje
 *
 * Uygulamada kullanılan tüm API yollarını merkezi olarak tanımlar.
 * Dinamik endpoint'ler için fonksiyon kullanır (id parametreli olanlar).
 */
export const API_ENDPOINTS = {
    // ==========================================
    // Kimlik doğrulama (authentication) endpoint'leri
    // ==========================================
    LOGIN: API_LOGIN_URL,                             // Kullanıcı giriş endpoint'i
    VALIDATE: `${API_USER_URL}`,                      // Token doğrulama endpoint'i
    LOGOUT: `${API_BASE_URL}/auth/logout`,            // Kullanıcı çıkış endpoint'i
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,    // Token yenileme endpoint'i
    VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,      // Token kontrol endpoint'i

    // ==========================================
    // Örnek CRUD (Create, Read, Update, Delete) endpoint'leri
    // ==========================================
    GET_EXAMPLES: '/postop/list',                     // Tüm örnekleri listele
    GET_EXAMPLE: (id) => `/examples/${id}`,           // Tek örneği getir (ID ile)
    CREATE_EXAMPLE: '/examples',                      // Yeni örnek oluştur
    UPDATE_EXAMPLE: (id) => `/examples/${id}`,        // Örneği güncelle (ID ile)
    DELETE_EXAMPLE: (id) => `/examples/${id}`,        // Örneği sil (ID ile)
    DELETE_MULTIPLE_EXAMPLES: '/examples/bulk-delete', // Toplu silme
    EXPORT_EXAMPLES: '/examples/export',              // Örnekleri dışa aktar

    // ==========================================
    // Lookup (Referans Verileri) endpoint'leri
    // ==========================================
    GET_COUNTRIES: '/Country',                        // Ülke listesi
    GET_HOTELS: '/Hotel',                             // Otel listesi
    GET_AIRLINES: '/Airline',                         // Havayolu listesi
    GET_USERS: `${API_USER_MANAGEMENT_URL}/User/get-all`, // Kullanıcı listesi (doktor, danışman)

    // ==========================================
    // Dashboard endpoint'leri
    // ==========================================
    GET_DASHBOARD_STATS: '/dashboard/stats',          // Dashboard istatistikleri
    GET_RECENT_TRANSFERS: '/dashboard/recent',        // Son transferler
};

/**
 * API_CONFIG - API istekleri için genel yapılandırma ayarları
 *
 * Timeout, retry (yeniden deneme) ve temel URL ayarlarını içerir.
 */
export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUT: 30000,                    // 30 saniye
    RETRY_ATTEMPTS: 3,                 // Başarısız isteklerde 3 kez dene
    RETRY_DELAY: 1000,                 // Her deneme arasında 1 saniye bekle
};

/**
 * HTTP_STATUS - HTTP durum kodları
 *
 * API yanıtlarını kontrol ederken kullanılır
 */
export const HTTP_STATUS = {
    OK: 200,                           // Başarılı
    CREATED: 201,                      // Oluşturuldu
    NO_CONTENT: 204,                   // İçerik yok (başarılı silme)
    BAD_REQUEST: 400,                  // Hatalı istek
    UNAUTHORIZED: 401,                 // Yetkisiz (token geçersiz)
    FORBIDDEN: 403,                    // Yasak (yetki yok)
    NOT_FOUND: 404,                    // Bulunamadı
    INTERNAL_SERVER_ERROR: 500,        // Sunucu hatası
    SERVICE_UNAVAILABLE: 503,          // Servis kullanılamıyor
};

/**
 * RESPONSE_MESSAGES - API yanıt mesajları
 *
 * Kullanıcıya gösterilecek hata ve başarı mesajları
 */
export const RESPONSE_MESSAGES = {
    SUCCESS: {
        CREATE: 'Kayıt başarıyla oluşturuldu',
        UPDATE: 'Kayıt başarıyla güncellendi',
        DELETE: 'Kayıt başarıyla silindi',
        SAVE: 'Değişiklikler kaydedildi',
    },
    ERROR: {
        NETWORK: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
        UNAUTHORIZED: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
        FORBIDDEN: 'Bu işlem için yetkiniz bulunmamaktadır.',
        NOT_FOUND: 'Kayıt bulunamadı.',
        SERVER: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
        UNKNOWN: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    },
};

export default {
    API_ENDPOINTS,
    API_CONFIG,
    HTTP_STATUS,
    RESPONSE_MESSAGES,
};