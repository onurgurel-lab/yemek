/**
 * Excel Servis Modülü
 * Excel içe/dışa aktarım işlemleri
 *
 * ✅ Eski projeden aktarılan özellikler:
 * - Ay/yıl parametreli template indirme (downloadExcelTemplate)
 * - Menü export işlemi (exportMenuToExcel)
 * - Dosya boyutu formatlama (formatFileSize)
 * - HTTP hata mesajları (getErrorMessage)
 * - Detaylı dosya doğrulama (validateExcelFile)
 * - Import sonuç formatlama (formatImportResult)
 *
 * @module services/excelService
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS, MEAL_CATEGORIES } from '@/constants/mealMenuApi';

// ==================== API ENDPOINT'LERİ ====================

// YEMEKHANE_ENDPOINTS.EXCEL varsa kullan, yoksa fallback
const EXCEL = YEMEKHANE_ENDPOINTS?.EXCEL || {
    IMPORT: '/api/mealmenu/importfromexcel',
    EXPORT: '/api/mealmenu/exporttoexcel',
    TEMPLATE: '/api/mealmenu/exporttemplate',
};

// ==================== SABİTLER ====================

export const VALID_EXTENSIONS = ['.xlsx', '.xls'];
export const VALID_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Ay isimleri (Türkçe)
export const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Ay isimleri (dosya adı için - ASCII)
const MONTH_NAMES_ASCII = [
    'ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran',
    'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'
];

// ==================== DOĞRULAMA İŞLEMLERİ ====================

/**
 * Dosya uzantısını doğrular
 * @param {string} filename - Dosya adı
 * @returns {boolean} Geçerli mi?
 */
export const validateFileExtension = (filename) => {
    if (!filename) return false;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return VALID_EXTENSIONS.includes(ext);
};

/**
 * Dosya MIME tipini doğrular
 * @param {string} mimeType - Dosya MIME tipi
 * @returns {boolean} Geçerli mi?
 */
export const validateFileMimeType = (mimeType) => {
    return VALID_MIME_TYPES.includes(mimeType);
};

/**
 * Dosya boyutunu doğrular
 * @param {number} fileSize - Dosya boyutu (bytes)
 * @returns {boolean} Geçerli mi?
 */
export const validateFileSize = (fileSize) => {
    return fileSize <= MAX_FILE_SIZE_BYTES;
};

/**
 * Dosyayı tam olarak doğrular
 * @param {File} file - Dosya objesi
 * @returns {Object} { isValid, errors }
 */
export const validateFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('Dosya seçilmedi.');
        return { isValid: false, errors };
    }

    // Uzantı kontrolü
    if (!validateFileExtension(file.name)) {
        errors.push(`Geçersiz dosya uzantısı. Kabul edilen: ${VALID_EXTENSIONS.join(', ')}`);
    }

    // Boyut kontrolü
    if (!validateFileSize(file.size)) {
        errors.push(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'dan büyük olamaz.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Eski uyumluluk için validateExcelFile (eski projeden)
 * @param {File} file - Dosya objesi
 * @throws {Error} Doğrulama hatası
 * @returns {boolean} true
 */
export const validateExcelFile = (file) => {
    if (!VALID_MIME_TYPES.includes(file.type)) {
        throw new Error('Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'dan büyük olamaz.`);
    }

    return true;
};

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Dosya boyutunu okunabilir formata çevirir (eski projeden)
 * @param {number} bytes - Byte cinsinden boyut
 * @returns {string} Formatlanmış boyut
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * HTTP hata kodlarını kullanıcı dostu mesajlara çevirir (eski projeden)
 * @param {number} statusCode - HTTP status kodu
 * @returns {string} Kullanıcı dostu mesaj
 */
export const getErrorMessage = (statusCode) => {
    const errorMessages = {
        0: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
        400: 'Geçersiz istek. Lütfen dosyanızı kontrol edin.',
        401: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
        403: 'Bu işlem için yetkiniz bulunmamaktadır.',
        404: 'İstenen kaynak bulunamadı.',
        413: 'Dosya boyutu çok büyük. Lütfen daha küçük bir dosya seçin.',
        415: 'Desteklenmeyen dosya formatı. Lütfen Excel dosyası (.xlsx, .xls) seçin.',
        422: 'Dosya içeriği geçersiz. Lütfen dosya formatını kontrol edin.',
        500: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
        502: 'Sunucu geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
        503: 'Servis geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
    };
    return errorMessages[statusCode] || 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
};

/**
 * Import sonucunu formatlar
 * @param {Object} result - API yanıtı
 * @returns {Object} Formatlanmış sonuç
 */
export const formatImportResult = (result) => {
    if (!result) {
        return {
            success: false,
            message: 'Beklenmeyen bir hata oluştu.',
            successCount: 0,
            errorCount: 0,
            errors: [],
        };
    }

    const data = result.data || result;

    return {
        success: data.importedCount > 0 || data.isSuccess,
        message: data.message || `${data.importedCount || 0} kayıt başarıyla içe aktarıldı.`,
        successCount: data.importedCount || 0,
        errorCount: data.errorCount || 0,
        errors: data.errors || [],
    };
};

// ==================== İÇE AKTARMA (IMPORT) ====================

/**
 * Excel dosyasından menü içe aktarır
 * @param {File} file - Excel dosyası
 * @param {Function} onProgress - İlerleme callback'i
 * @returns {Promise<Object>} API yanıtı
 */
export const importFromExcel = async (file, onProgress) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(' '));
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(EXCEL.IMPORT, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
    });

    return response.data;
};

/**
 * Excel dosyasını API'ye gönderme (eski proje uyumluluğu)
 * @param {File} file - Excel dosyası
 * @returns {Promise<Object>} API yanıtı
 */
export const uploadExcelFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post(EXCEL.IMPORT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Excel Upload Error:', error);
        // Error response yapısını koru
        if (!error.response && error.name === 'TypeError') {
            error.response = { status: 0 }; // Network error için
        }
        throw error;
    }
};

// ==================== DIŞA AKTARMA (EXPORT) ====================

/**
 * Menüleri Excel formatında dışa aktarır
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Object>} { success: boolean }
 */
export const exportToExcel = async (filters = {}) => {
    try {
        const response = await axiosInstance.get(EXCEL.EXPORT, {
            params: filters,
            responseType: 'blob',
        });

        // Blob'u indirilebilir dosyaya çevir
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Dosya adını tarihle oluştur
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `yemek-menu-${date}.xlsx`);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        console.error('Menu Export Error:', error);
        if (!error.response && error.name === 'TypeError') {
            error.response = { status: 0 };
        }
        throw error;
    }
};

/**
 * Mevcut menüyü Excel'e aktarma (eski proje uyumluluğu)
 * @returns {Promise<void>}
 */
export const exportMenuToExcel = async () => {
    try {
        const response = await axiosInstance.get(EXCEL.EXPORT, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yemek-menu-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Menu Export Error:', error);
        if (!error.response && error.name === 'TypeError') {
            error.response = { status: 0 };
        }
        throw error;
    }
};

// ==================== ŞABLON İŞLEMLERİ ====================

/**
 * Excel şablonunu indirir (ay ve yıl parametreli - eski projeden)
 * @param {number|null} month - Ay (1-12)
 * @param {number|null} year - Yıl
 * @returns {Promise<void>}
 */
export const downloadExcelTemplate = async (month = null, year = null) => {
    try {
        // URL ve parametreleri oluştur
        const params = {};
        if (month && year) {
            params.month = month;
            params.year = year;
        }

        const response = await axiosInstance.get(EXCEL.TEMPLATE, {
            params,
            responseType: 'blob',
        });

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        // Dosya adını ay ve yıla göre oluştur
        let fileName = 'yemek-menu-template';
        if (month && year) {
            fileName += `-${MONTH_NAMES_ASCII[month - 1]}-${year}`;
        }
        fileName += '.xlsx';

        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Template Download Error:', error);
        if (!error.response && error.name === 'TypeError') {
            error.response = { status: 0 };
        }
        throw error;
    }
};

/**
 * Excel şablonunu indirir (basit versiyon)
 * @returns {Promise<Object>} { success: boolean }
 */
export const downloadTemplate = async () => {
    try {
        const response = await axiosInstance.get(EXCEL.TEMPLATE, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'menu_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        throw new Error('Şablon indirilemedi. Lütfen tekrar deneyin.');
    }
};

/**
 * Şablon bilgilerini döndürür
 * @returns {Object} Şablon bilgileri
 */
export const getTemplateInfo = () => {
    return {
        requiredColumns: [
            { name: 'Tarih', description: 'Menü tarihi (GG.AA.YYYY)', required: true },
            { name: 'Öğün', description: 'Öğle(1) veya Akşam(2)', required: true },
            { name: 'Yemek Adı', description: 'Yemeğin adı', required: true },
            { name: 'Kategori', description: 'Yemek kategorisi', required: true },
            { name: 'Kalori', description: 'Kalori değeri (kcal)', required: false },
        ],
        validCategories: MEAL_CATEGORIES?.map((c) => c.value) || [
            'ÇORBA', 'ANA YEMEK', 'YARDIMCI YEMEK', 'SPESYEL SALATA', 'CORNER'
        ],
        validMealTimes: ['Öğle', 'Akşam'],
        notes: [
            'Tarih formatı: GG.AA.YYYY (örn: 15.01.2025)',
            'Öğün değerleri: Öğle(1) veya Akşam(2)',
            'Kategori değerleri büyük/küçük harf duyarlıdır',
            'Kalori alanı boş bırakılabilir',
            'Her satır bir yemek öğesini temsil eder',
        ],
    };
};

/**
 * Örnek veri oluşturur
 * @returns {Array} Örnek menü verileri
 */
export const generateSampleData = () => {
    const today = new Date();
    const formatDate = (d) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    return [
        {
            tarih: formatDate(today),
            ogun: 'Öğle',
            yemekAdi: 'Mercimek Çorbası',
            kategori: 'ÇORBA',
            kalori: 150,
        },
        {
            tarih: formatDate(today),
            ogun: 'Öğle',
            yemekAdi: 'Tavuk Sote',
            kategori: 'ANA YEMEK',
            kalori: 350,
        },
        {
            tarih: formatDate(today),
            ogun: 'Öğle',
            yemekAdi: 'Pilav',
            kategori: 'YARDIMCI YEMEK',
            kalori: 200,
        },
        {
            tarih: formatDate(today),
            ogun: 'Akşam',
            yemekAdi: 'Domates Çorbası',
            kategori: 'ÇORBA',
            kalori: 120,
        },
        {
            tarih: formatDate(today),
            ogun: 'Akşam',
            yemekAdi: 'Köfte',
            kategori: 'ANA YEMEK',
            kalori: 400,
        },
    ];
};

// ==================== DEFAULT EXPORT ====================

export default {
    // Doğrulama
    validateFile,
    validateExcelFile,
    validateFileExtension,
    validateFileMimeType,
    validateFileSize,

    // Yardımcı
    formatFileSize,
    getErrorMessage,
    formatImportResult,

    // İçe aktarma
    importFromExcel,
    uploadExcelFile,

    // Dışa aktarma
    exportToExcel,
    exportMenuToExcel,

    // Şablon
    downloadTemplate,
    downloadExcelTemplate,
    getTemplateInfo,
    generateSampleData,

    // Sabitler
    VALID_EXTENSIONS,
    VALID_MIME_TYPES,
    MAX_FILE_SIZE_MB,
    MAX_FILE_SIZE_BYTES,
    MONTH_NAMES,
};