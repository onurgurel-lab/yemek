/**
 * Form Data Helper Utilities
 * Form verilerini farklı formatlara dönüştürme yardımcı fonksiyonları
 */

/**
 * Object'i URLSearchParams formatına çevirir
 * @param {Object} data - Form verisi
 * @returns {URLSearchParams} - URL encoded form data
 */
export const createFormData = (data) => {
    const params = new URLSearchParams();

    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
            params.append(key, data[key]);
        }
    }

    return params;
};

/**
 * Object'i multipart/form-data formatına çevirir (dosya yükleme için)
 * @param {Object} data - Form verisi
 * @returns {FormData} - Multipart form data
 */
export const createMultipartFormData = (data) => {
    const formData = new FormData();

    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
            if (data[key] instanceof File || data[key] instanceof Blob) {
                // Dosya ise direkt ekle
                formData.append(key, data[key]);
            } else if (Array.isArray(data[key])) {
                // Array ise her elemanı ayrı ekle
                data[key].forEach((item, index) => {
                    if (typeof item === 'object' && !(item instanceof File)) {
                        formData.append(`${key}[${index}]`, JSON.stringify(item));
                    } else {
                        formData.append(`${key}[${index}]`, item);
                    }
                });
            } else if (typeof data[key] === 'object') {
                // Object ise JSON string olarak ekle
                formData.append(key, JSON.stringify(data[key]));
            } else {
                // Diğer durumlarda string olarak ekle
                formData.append(key, String(data[key]));
            }
        }
    }

    return formData;
};

/**
 * Axios config'i form data için hazırlar
 * @param {boolean} isMultipart - Multipart form data mı?
 * @returns {Object} - Axios headers config
 */
export const getFormHeaders = (isMultipart = false) => {
    if (isMultipart) {
        // Multipart için Content-Type'ı axios otomatik ayarlasın
        return {};
    }

    return {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
};

/**
 * Object'i query string'e çevirir
 * @param {Object} params - Query parametreleri
 * @returns {string} - Query string (örn: "?name=John&age=30")
 */
export const objectToQueryString = (params) => {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }

    const searchParams = new URLSearchParams();

    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            if (Array.isArray(params[key])) {
                params[key].forEach(value => {
                    searchParams.append(key, value);
                });
            } else {
                searchParams.append(key, params[key]);
            }
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Query string'i object'e çevirir
 * @param {string} queryString - Query string (örn: "?name=John&age=30")
 * @returns {Object} - Parse edilmiş object
 */
export const queryStringToObject = (queryString) => {
    if (!queryString) return {};

    // Başındaki ? işaretini temizle
    const cleanQuery = queryString.startsWith('?')
        ? queryString.substring(1)
        : queryString;

    const params = new URLSearchParams(cleanQuery);
    const result = {};

    for (const [key, value] of params.entries()) {
        if (result[key]) {
            // Aynı key birden fazla varsa array yap
            if (Array.isArray(result[key])) {
                result[key].push(value);
            } else {
                result[key] = [result[key], value];
            }
        } else {
            result[key] = value;
        }
    }

    return result;
};

/**
 * Kullanım Örnekleri:
 *
 * 1. URL encoded form data oluşturma:
 * ```javascript
 * const data = { username: 'john', password: '123' };
 * const formData = createFormData(data);
 * axios.post('/login', formData, {
 *   headers: getFormHeaders()
 * });
 * ```
 *
 * 2. Multipart form data (dosya yükleme):
 * ```javascript
 * const data = {
 *   file: fileInput.files[0],
 *   title: 'My File',
 *   tags: ['important', 'urgent']
 * };
 * const formData = createMultipartFormData(data);
 * axios.post('/upload', formData, {
 *   headers: getFormHeaders(true)
 * });
 * ```
 *
 * 3. Query string oluşturma:
 * ```javascript
 * const params = { page: 1, size: 10, search: 'test' };
 * const queryString = objectToQueryString(params);
 * // Sonuç: "?page=1&size=10&search=test"
 * ```
 */

export default {
    createFormData,
    createMultipartFormData,
    getFormHeaders,
    objectToQueryString,
    queryStringToObject,
};