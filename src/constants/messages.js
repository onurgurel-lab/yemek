/**
 * Mesaj Sabitleri
 *
 * Uygulama genelinde kullanılan tüm mesaj key'lerini içerir.
 * i18n (çoklu dil) sistemi ile birlikte çalışır.
 * Her key, dil dosyalarındaki (tr.json, en.json) karşılık gelen çeviriyi işaret eder.
 */

/**
 * SUCCESS_MESSAGES - Başarılı işlem mesajları
 *
 * Kullanıcıya işlemlerin başarıyla tamamlandığını bildiren
 * mesajların i18n key'leri.
 */
export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'auth.loginSuccess',       // Giriş başarılı mesajı
    LOGOUT_SUCCESS: 'auth.logoutSuccess',     // Çıkış başarılı mesajı
    SAVE_SUCCESS: 'messages.saveSuccess',     // Kaydetme başarılı mesajı
    DELETE_SUCCESS: 'messages.deleteSuccess', // Silme başarılı mesajı
    UPDATE_SUCCESS: 'messages.updateSuccess', // Güncelleme başarılı mesajı
}

/**
 * ERROR_MESSAGES - Hata mesajları
 *
 * Kullanıcıya hataları bildiren mesajların i18n key'leri.
 * HTTP durum kodları ve çeşitli hata senaryoları için kullanılır.
 */
export const ERROR_MESSAGES = {
    LOGIN_ERROR: 'auth.loginError',           // Giriş hatası
    NETWORK_ERROR: 'errors.networkError',     // Ağ bağlantı hatası
    VALIDATION_ERROR: 'errors.validationError', // Doğrulama hatası
    UNAUTHORIZED: 'errors.unauthorized',      // Yetkisiz erişim (401)
    FORBIDDEN: 'errors.forbidden',            // Yasak işlem (403)
    NOT_FOUND: 'errors.notFound',            // Kaynak bulunamadı (404)
    SERVER_ERROR: 'errors.serverError',      // Sunucu hatası (500)
    UNKNOWN_ERROR: 'errors.unknownError',    // Bilinmeyen hata
}

/**
 * VALIDATION_MESSAGES - Form doğrulama mesajları
 *
 * Form alanlarının validasyonu sırasında gösterilen
 * hata mesajlarının i18n key'leri.
 */
export const VALIDATION_MESSAGES = {
    REQUIRED: 'validation.required',           // Zorunlu alan mesajı
    EMAIL: 'validation.email',                 // Geçersiz email formatı
    MIN_LENGTH: 'validation.minLength',        // Minimum karakter sayısı
    MAX_LENGTH: 'validation.maxLength',        // Maximum karakter sayısı
    PASSWORD_MATCH: 'validation.passwordMatch', // Şifre eşleşmiyor
}

/**
 * CONFIRM_MESSAGES - Onay mesajları
 *
 * Kullanıcıdan onay gerektiren işlemler için
 * gösterilen mesajların i18n key'leri.
 */
export const CONFIRM_MESSAGES = {
    DELETE: 'messages.confirmDelete', // Silme onayı mesajı
}