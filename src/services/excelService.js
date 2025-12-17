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

// ==================== DIŞA AKTARMA ====================

/**
 * Menüleri Excel formatında dışa aktarır
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
        link.setAttribute('download', `menu_export_${date}.xlsx`);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        throw new Error('Dışa aktarma başarısız. Lütfen tekrar deneyin.');
    }
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

export default {
    importFromExcel,
    exportToExcel,
    downloadTemplate,
    validateFile,
    validateFileExtension,
    validateFileSize,
    getTemplateInfo,
    generateSampleData,
};