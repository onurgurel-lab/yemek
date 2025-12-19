/**
 * ExcelUpload.jsx - Excel Yükleme ve Yönetim Sayfası
 *
 * ✅ Projeye uyumlu özellikler:
 * - useUserRoles hook'u ile yetki kontrolü (canManageMenu)
 * - useAuth hook'u ile kullanıcı bilgisi
 * - Ant Design bileşenleri (message, Modal, notification)
 * - TailwindCSS stilleri
 *
 * ✅ Eski projeden aktarılan özellikler:
 * - Ay/Yıl seçici ile template indirme
 * - Drag & Drop dosya yükleme
 * - Menüyü Excel'e aktarma
 * - Detaylı hata yönetimi
 *
 * @module pages/Yemekhane/ExcelUpload
 */

import React, { useState, useRef } from 'react';
import {
    Card,
    Button,
    Select,
    Space,
    Typography,
    Divider,
    Row,
    Col,
    Alert,
    Tag,
    List,
    Modal,
    message,
    notification,
} from 'antd';
import {
    UploadOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    DeleteOutlined,
    CloudUploadOutlined,
    ExportOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

// Proje hook'ları
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';

// Servisler
import {
    uploadExcelFile,
    validateExcelFile,
    formatFileSize,
    downloadExcelTemplate,
    exportMenuToExcel,
    getErrorMessage,
    getTemplateInfo,
    MONTH_NAMES,
} from '@/services/excelService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * ExcelUpload Component
 * Yemek menüsü Excel yönetim sayfası
 */
const ExcelUpload = () => {
    // ==================== STATE ====================
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [isExportingMenu, setIsExportingMenu] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const fileInputRef = useRef(null);

    // ==================== HOOKS ====================
    const { canManageMenu, isAdmin, isYemekhaneAdmin } = useUserRoles();
    const { user } = useAuth();

    // Yıl seçenekleri (mevcut yıldan 2 yıl öncesi ve sonrası)
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearOptions.push(i);
    }

    // Template bilgileri
    const templateInfo = getTemplateInfo();

    // ==================== DOSYA İŞLEMLERİ ====================

    /**
     * Dosya seçme işlemi
     */
    const handleFileSelect = (file) => {
        try {
            validateExcelFile(file);
            setSelectedFile(file);
            setUploadStatus(null);
        } catch (error) {
            setUploadStatus({ type: 'error', message: error.message });
            setSelectedFile(null);
            message.error(error.message);
        }
    };

    /**
     * Dosya input değişikliği
     */
    const handleFileInputChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * Dosya kaldırma
     */
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadStatus(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ==================== DRAG & DROP ====================

    /**
     * Drag işlemleri
     */
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    /**
     * Drop işlemi
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // ==================== YÜKLEME İŞLEMİ ====================

    /**
     * Dosya yükleme
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus({ type: 'error', message: 'Lütfen bir dosya seçin.' });
            message.warning('Lütfen bir dosya seçin.');
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);

        try {
            const result = await uploadExcelFile(selectedFile);

            // Başarılı import durumu
            if (result.data && result.data.importedCount !== undefined) {
                const { importedCount, errorCount, errors, message: resultMessage } = result.data;

                if (errorCount > 0 && errors && errors.length > 0) {
                    // Hem başarılı hem hatalı kayıtlar var - Modal ile göster
                    Modal.warning({
                        title: 'Kısmi Başarı',
                        width: 600,
                        content: (
                            <div>
                                <p><strong>✅ {importedCount} kayıt başarıyla import edildi</strong></p>
                                <p><strong>❌ {errorCount} satırda hata oluştu:</strong></p>
                                <div
                                    style={{
                                        background: '#f8f9fa',
                                        padding: 10,
                                        borderRadius: 5,
                                        marginTop: 10,
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                    }}
                                >
                                    {errors.map((error, index) => (
                                        <div key={index}>• {error}</div>
                                    ))}
                                </div>
                            </div>
                        ),
                        okText: 'Tamam',
                    });

                    notification.warning({
                        message: 'Kısmi Başarı',
                        description: `${importedCount} kayıt eklendi, ${errorCount} hata oluştu.`,
                        duration: 5,
                    });
                } else {
                    // Tüm kayıtlar başarılı
                    Modal.success({
                        title: 'Başarılı!',
                        content: `${importedCount} kayıt başarıyla import edildi.`,
                        okText: 'Tamam',
                    });

                    message.success(`${importedCount} kayıt başarıyla import edildi.`);
                }

                setUploadStatus({
                    type: 'success',
                    message: resultMessage || `Excel dosyası başarıyla yüklendi! ${importedCount} kayıt import edildi.`,
                });
            } else {
                // Eski format için fallback
                setUploadStatus({
                    type: 'success',
                    message: `Excel dosyası başarıyla yüklendi! ${result.message || ''}`,
                });

                Modal.success({
                    title: 'Başarılı!',
                    content: 'Excel dosyası başarıyla yüklendi!',
                    okText: 'Tamam',
                });
            }

            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);

            let errorMessage = 'Yükleme sırasında bir hata oluştu.';
            if (error.response) {
                errorMessage = getErrorMessage(error.response.status);
            } else if (error.message) {
                errorMessage = error.message;
            }

            Modal.error({
                title: 'Yükleme Hatası',
                content: errorMessage,
                okText: 'Tamam',
            });

            setUploadStatus({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setIsUploading(false);
        }
    };

    // ==================== TEMPLATE İNDİRME ====================

    /**
     * Template indirme
     */
    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        setUploadStatus(null);

        try {
            await downloadExcelTemplate(selectedMonth, selectedYear);
            const successMessage = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} için Excel şablonu başarıyla indirildi!`;

            notification.success({
                message: 'İndirme Başarılı!',
                description: successMessage,
                duration: 4,
            });

            setUploadStatus({
                type: 'success',
                message: successMessage,
            });
        } catch (error) {
            console.error('Template download error:', error);

            let errorMessage = 'Şablon indirme sırasında bir hata oluştu.';
            if (error.response) {
                errorMessage = getErrorMessage(error.response.status);
            } else if (error.message) {
                errorMessage = error.message;
            }

            notification.error({
                message: 'İndirme Hatası',
                description: errorMessage,
                duration: 5,
            });

            setUploadStatus({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    // ==================== MENÜ EXPORT ====================

    /**
     * Menüyü Excel'e aktarma
     */
    const handleExportMenu = async () => {
        setIsExportingMenu(true);
        setUploadStatus(null);

        try {
            await exportMenuToExcel();
            const successMessage = 'Mevcut menü başarıyla Excel\'e aktarıldı!';

            notification.success({
                message: 'Export Başarılı!',
                description: successMessage,
                duration: 4,
            });

            setUploadStatus({
                type: 'success',
                message: successMessage,
            });
        } catch (error) {
            console.error('Menu export error:', error);

            let errorMessage = 'Menü export sırasında bir hata oluştu.';
            if (error.response) {
                errorMessage = getErrorMessage(error.response.status);
            } else if (error.message) {
                errorMessage = error.message;
            }

            notification.error({
                message: 'Export Hatası',
                description: errorMessage,
                duration: 5,
            });

            setUploadStatus({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setIsExportingMenu(false);
        }
    };

    // ==================== YETKİ KONTROLÜ ====================

    if (!canManageMenu) {
        return (
            <div className="p-6">
                <Card>
                    <Alert
                        message="Erişim Engellendi"
                        description="Bu sayfaya erişim yetkiniz bulunmamaktadır. Yemekhane projesinde Admin veya RaporAdmin rolüne sahip olmanız gerekmektedir."
                        type="error"
                        showIcon
                        icon={<CloseCircleOutlined />}
                    />
                </Card>
            </div>
        );
    }

    // ==================== RENDER ====================

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <Card className="shadow-md">
                {/* Başlık */}
                <div className="text-center mb-6">
                    <Title level={2} className="!mb-2">
                        <FileExcelOutlined className="mr-2 text-green-600" />
                        Yemek Menüsü Excel Yönetimi
                    </Title>
                    <Paragraph type="secondary">
                        Yemek menüsü verilerinizi Excel formatında yönetin ve düzenleyin.
                    </Paragraph>
                    {/* Rol bilgisi */}
                    <Space className="mt-2">
                        {isAdmin && <Tag color="red">Admin</Tag>}
                        {isYemekhaneAdmin && !isAdmin && <Tag color="orange">RaporAdmin</Tag>}
                        {user?.fullName && <Tag color="blue">{user.fullName}</Tag>}
                    </Space>
                </div>

                <Divider />

                {/* Ay ve Yıl Seçici */}
                <Card
                    size="small"
                    className="mb-4 bg-gray-50"
                    title={
                        <Space>
                            <CalendarOutlined />
                            <span>Şablon için ay ve yıl seçin</span>
                        </Space>
                    }
                >
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={8}>
                            <div className="mb-2">
                                <Text strong>Ay:</Text>
                            </div>
                            <Select
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                style={{ width: '100%' }}
                                size="large"
                            >
                                {MONTH_NAMES.map((month, index) => (
                                    <Option key={index + 1} value={index + 1}>
                                        {month}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={8}>
                            <div className="mb-2">
                                <Text strong>Yıl:</Text>
                            </div>
                            <Select
                                value={selectedYear}
                                onChange={setSelectedYear}
                                style={{ width: '100%' }}
                                size="large"
                            >
                                {yearOptions.map((year) => (
                                    <Option key={year} value={year}>
                                        {year}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={8} className="flex items-end">
                            <div className="w-full text-center p-3 bg-white rounded-lg border">
                                <Text type="secondary">Seçili Dönem:</Text>
                                <div>
                                    <Text strong className="text-lg">
                                        {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                    </Text>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Excel İşlemleri Butonları */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12}>
                        <Button
                            type="primary"
                            icon={isDownloadingTemplate ? <LoadingOutlined spin /> : <DownloadOutlined />}
                            onClick={handleDownloadTemplate}
                            loading={isDownloadingTemplate}
                            block
                            size="large"
                            className="h-14"
                        >
                            {isDownloadingTemplate ? 'İndiriliyor...' : '📋 Boş Şablon İndir'}
                        </Button>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Button
                            icon={isExportingMenu ? <LoadingOutlined spin /> : <ExportOutlined />}
                            onClick={handleExportMenu}
                            loading={isExportingMenu}
                            block
                            size="large"
                            className="h-14 border-green-500 text-green-600 hover:text-green-500 hover:border-green-400"
                        >
                            {isExportingMenu ? 'Aktarılıyor...' : '📊 Menüyü Excel\'e Aktar'}
                        </Button>
                    </Col>
                </Row>

                <Divider>Dosya Yükleme</Divider>

                {/* Drag & Drop Alanı */}
                <div
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center
                        ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                        ${selectedFile ? 'border-green-500 bg-green-50' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {selectedFile ? (
                        <div className="flex flex-col items-center">
                            <FileExcelOutlined className="text-5xl text-green-600 mb-4" />
                            <Title level={4} className="!mb-1">
                                {selectedFile.name}
                            </Title>
                            <Text type="secondary" className="mb-4">
                                {formatFileSize(selectedFile.size)}
                            </Text>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                            >
                                Dosyayı Kaldır
                            </Button>
                        </div>
                    ) : (
                        <>
                            <CloudUploadOutlined
                                className={`text-5xl mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
                            />
                            <Title level={4} className="!mb-2">
                                Excel dosyasını buraya sürükleyin
                            </Title>
                            <Text type="secondary">veya tıklayarak dosya seçin</Text>
                            <div className="mt-3">
                                <Tag color="blue">.xlsx</Tag>
                                <Tag color="blue">.xls</Tag>
                                <Tag color="default">Max 5MB</Tag>
                            </div>
                        </>
                    )}
                </div>

                {/* Gizli dosya input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                />

                {/* Yükleme Butonu */}
                <div className="mt-6 text-center">
                    <Button
                        type="primary"
                        icon={isUploading ? <LoadingOutlined spin /> : <UploadOutlined />}
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        loading={isUploading}
                        size="large"
                        className="px-12 h-12"
                    >
                        {isUploading ? 'Yükleniyor...' : 'Excel Dosyasını Yükle'}
                    </Button>
                </div>

                {/* Durum Mesajları */}
                {uploadStatus && (
                    <Alert
                        message={uploadStatus.type === 'success' ? 'İşlem Başarılı' : 'Hata'}
                        description={uploadStatus.message}
                        type={uploadStatus.type === 'success' ? 'success' : 'error'}
                        showIcon
                        className="mt-6"
                        closable
                        onClose={() => setUploadStatus(null)}
                    />
                )}

                <Divider />

                {/* Bilgi Kutusu */}
                <Card
                    size="small"
                    title={
                        <Space>
                            <InfoCircleOutlined />
                            <span>Excel Dosya Formatı</span>
                        </Space>
                    }
                    className="bg-gray-50"
                >
                    <Paragraph className="!mb-3">
                        Excel dosyanızda şu sütunlar bulunmalıdır:
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={templateInfo.requiredColumns}
                        renderItem={(item) => (
                            <List.Item className="!py-2">
                                <Space>
                                    <Tag color={item.required ? 'red' : 'default'}>
                                        {item.required ? 'Zorunlu' : 'Opsiyonel'}
                                    </Tag>
                                    <Text strong>{item.name}:</Text>
                                    <Text type="secondary">{item.description}</Text>
                                </Space>
                            </List.Item>
                        )}
                    />
                    <Divider className="!my-3" />
                    <div>
                        <Text strong>Notlar:</Text>
                        <ul className="list-disc pl-5 mt-2 text-gray-600">
                            {templateInfo.notes.map((note, index) => (
                                <li key={index} className="text-sm mb-1">
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            </Card>
        </div>
    );
};

export default ExcelUpload;