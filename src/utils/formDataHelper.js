/**
 * Object'i URLSearchParams formatına çevirir
 * @param {Object} data - Form verisi
 * @returns {URLSearchParams} - URL encoded form data
 */
export const createFormData = (data) => {
    const params = new URLSearchParams()

    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
            params.append(key, data[key])
        }
    }

    return params
}

/**
 * Object'i multipart/form-data formatına çevirir (dosya yükleme için)
 * @param {Object} data - Form verisi
 * @returns {FormData} - Multipart form data
 */
export const createMultipartFormData = (data) => {
    const formData = new FormData()

    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
            if (data[key] instanceof File || data[key] instanceof Blob) {
                // Dosya ise direkt ekle
                formData.append(key, data[key])
            } else if (Array.isArray(data[key])) {
                // Array ise her elemanı ayrı ekle
                data[key].forEach((item, index) => {
                    if (typeof item === 'object' && !(item instanceof File)) {
                        formData.append(`${key}[${index}]`, JSON.stringify(item))
                    } else {
                        formData.append(`${key}[${index}]`, item)
                    }
                })
            } else if (typeof data[key] === 'object') {
                // Object ise JSON string olarak ekle
                formData.append(key, JSON.stringify(data[key]))
            } else {
                // Diğer durumlarda string olarak ekle
                formData.append(key, String(data[key]))
            }
        }
    }

    return formData
}

/**
 * Axios config'i form data için hazırlar
 * @param {boolean} isMultipart - Multipart form data mı?
 * @returns {Object} - Axios headers config
 */
export const getFormHeaders = (isMultipart = false) => {
    if (isMultipart) {
        // Multipart için Content-Type'ı axios otomatik ayarlasın
        return {}
    }

    return {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}