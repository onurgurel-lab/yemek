/**
 * Excel Servis Modülü
 * Excel içe/dışa aktarım işlemleri
 */

import axiosInstance from '@/utils/axiosInstance';
import { YEMEKHANE_ENDPOINTS, MEAL_CATEGORIES, MEAL_TIME_LABELS } from '@/constants/mealMenuApi';

const { EXCEL } = YEMEKHANE_ENDPOINTS;

// Sabitler
export const VALID_EXTENSIONS = ['.xlsx', '.xls'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ==================== DOĞRULAMA İŞLEMLERİ ====================

/**
 * Dosya uzantısını doğrular
 */
export const validateFileExtension = (filename) => {
    if (!filename) return false;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return VALID_EXTENSIONS.includes(ext);
};

/**
 * Dosya boyutunu doğrular
 */
export const validateFileSize = (fileSize) => {
    return fileSize <= MAX_FILE_SIZE_BYTES;
};

/**
 * Dosyayı tam doğrular
 */
export const validateFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('Dosya seçilmedi.');
        return { isValid: false, errors };
    }

    if (!validateFileExtension(file.name)) {
        errors.push(`Geçersiz dosya uzantısı. Kabul edilen: ${VALID_EXTENSIONS.join(', ')}`);
    }

    if (!validateFileSize(file.size)) {
        errors.push(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'dan büyük olamaz.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// ==================== İÇE AKTARMA ====================

/**
 * Excel dosyasından menü içe aktarır
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

// ==================== ŞABLON İŞLEMLERİ ====================

/**
 * Şablon bilgilerini döndürür
 */
export const getTemplateInfo = () => {
    return {
        requiredColumns: [
            { name: 'Tarih', description: 'Menü tarihi (GG.AA.YYYY)', required: true },
            { name: 'Öğün', description: 'Öğle veya Akşam', required: true },
            { name: 'Yemek Adı', description: 'Yemeğin adı', required: true },
            { name: 'Kategori', description: 'Yemek kategorisi', required: true },
            { name: 'Kalori', description: 'Kalori değeri (kcal)', required: false },
        ],
        validCategories: MEAL_CATEGORIES.map((c) => c.value),
        validMealTimes: ['Öğle', 'Akşam'],
        notes: [
            'Tarih formatı: GG.AA.YYYY (örn: 15.01.2025)',
            'Öğün değerleri: Öğle veya Akşam',
            'Kategori değerleri büyük/küçük harf duyarlıdır',
            'Kalori alanı boş bırakılabilir',
            'Her satır bir yemek öğesini temsil eder',
        ],
    };
};

/**
 * Örnek veri oluşturur
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

/**
 * Excel şablonunu indirir
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

// ==================== DIŞA AKTARMA ====================

/**
 * Menüleri Excel'e aktarır
 */
export const exportToExcel = async (startDate, endDate, filename) => {
    const response = await axiosInstance.get(EXCEL.EXPORT, {
        params: { startDate, endDate },
        responseType: 'blob',
    });

    const defaultFilename = `menu_${startDate}_${endDate}.xlsx`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
};

// ==================== SONUÇ FORMATLAMA ====================

/**
 * İçe aktarma sonucunu formatlar
 */
export const formatImportResult = (result) => {
    if (!result) {
        return {
            success: false,
            message: 'Sonuç alınamadı.',
            details: null,
        };
    }

    const { successCount = 0, errorCount = 0, errors = [], totalCount = 0 } = result;

    let message = '';
    if (errorCount === 0) {
        message = `${successCount} yemek başarıyla eklendi.`;
    } else if (successCount === 0) {
        message = `İçe aktarma başarısız. ${errorCount} hata oluştu.`;
    } else {
        message = `${successCount} yemek eklendi, ${errorCount} hata oluştu.`;
    }

    return {
        success: errorCount === 0,
        partial: successCount > 0 && errorCount > 0,
        message,
        details: {
            total: totalCount || successCount + errorCount,
            success: successCount,
            error: errorCount,
            errors: errors.slice(0, 10), // İlk 10 hatayı göster
            hasMoreErrors: errors.length > 10,
        },
    };
};

/**
 * Hata mesajlarını Türkçeleştirir
 */
export const translateErrorMessage = (error) => {
    const translations = {
        'Invalid date format': 'Geçersiz tarih formatı',
        'Invalid meal time': 'Geçersiz öğün değeri',
        'Invalid category': 'Geçersiz kategori',
        'Food name is required': 'Yemek adı zorunludur',
        'Date is required': 'Tarih zorunludur',
        'Row is empty': 'Satır boş',
        'Duplicate entry': 'Mükerrer kayıt',
    };

    for (const [key, value] of Object.entries(translations)) {
        if (error.includes(key)) {
            return error.replace(key, value);
        }
    }

    return error;
};

export default {
    VALID_EXTENSIONS,
    MAX_FILE_SIZE_MB,
    MAX_FILE_SIZE_BYTES,
    validateFileExtension,
    validateFileSize,
    validateFile,
    importFromExcel,
    getTemplateInfo,
    generateSampleData,
    downloadTemplate,
    exportToExcel,
    formatImportResult,
    translateErrorMessage,
};