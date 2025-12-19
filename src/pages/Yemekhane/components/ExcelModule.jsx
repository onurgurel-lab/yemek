/**
 * ExcelModule.jsx - Excel İçe/Dışa Aktarma Modülü
 *
 * Eski projedeki ExcelModule'un Ant Design uyarlaması
 * Excel dosyası yükleme ve indirme işlemleri
 *
 * @module pages/Yemekhane/components/ExcelModule
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Tabs,
    Upload,
    Button,
    Alert,
    Progress,
    Typography,
    Space,
    Divider,
    Row,
    Col,
    Card,
    List,
    Tag,
    Result,
    Statistic,
    message,
} from 'antd';
import {
    InboxOutlined,
    UploadOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import axiosInstance from '@/utils/axiosInstance';

// API Endpoints
const EXCEL_IMPORT_API = '/api/mealmenu/importfromexcel';
const EXCEL_EXPORT_API = '/api/mealmenu/exporttoexcel';

const { Dragger } = Upload;
const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * Hata kodlarını kullanıcı dostu mesajlara çevirme
 */
const getErrorMessage = (statusCode) => {
    const errorMessages = {
        400: 'Geçersiz istek. Lütfen dosyanızı kontrol edin.',
        401: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
        403: 'Bu işlem için yetkiniz bulunmamaktadır.',
        404: 'İstenen kaynak bulunamadı.',
        413: 'Dosya boyutu çok büyük. Lütfen daha küçük bir dosya seçin.',
        415: 'Desteklenmeyen dosya formatı. Lütfen Excel dosyası (.xlsx, .xls) seçin.',
        422: 'Dosya içeriği geçersiz. Lütfen dosya formatını kontrol edin.',
        500: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
        502: 'Sunucu geçici olarak kullanılamıyor.',
        503: 'Servis geçici olarak kullanılamıyor.',
    };
    return errorMessages[statusCode] || 'Beklenmeyen bir hata oluştu.';
};

/**
 * ExcelModule Component
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma fonksiyonu
 * @param {Function} props.onComplete - İşlem tamamlandığında çağrılacak fonksiyon
 */
const ExcelModule = ({ visible, onClose, onComplete }) => {
    const [activeTab, setActiveTab] = useState('import');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [downloading, setDownloading] = useState(false);

    /**
     * Modal kapanınca state'leri sıfırla
     */
    useEffect(() => {
        if (!visible) {
            resetStates();
        }
    }, [visible]);

    /**
     * State'leri sıfırla
     */
    const resetStates = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadResult(null);
        setActiveTab('import');
    };

    /**
     * Dosya seçimi kontrolü
     */
    const beforeUpload = (file) => {
        // Dosya türü kontrolü
        const isExcel =
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls');

        if (!isExcel) {
            message.error('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
            return Upload.LIST_IGNORE;
        }

        // Dosya boyutu kontrolü (10MB)
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('Dosya boyutu 10MB\'dan küçük olmalıdır!');
            return Upload.LIST_IGNORE;
        }

        setSelectedFile(file);
        setUploadResult(null);
        return false; // Auto upload'ı engelle
    };

    /**
     * Dosya yükleme işlemi
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            message.warning('Lütfen bir dosya seçin');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axiosInstance.post(
                EXCEL_IMPORT_API,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percent);
                    },
                }
            );

            const result = response.data;

            // API yanıtını parse et
            if (result?.data) {
                const { importedCount, errorCount, errors, message: resultMessage } = result.data;

                setUploadResult({
                    success: true,
                    importedCount: importedCount || 0,
                    errorCount: errorCount || 0,
                    errors: errors || [],
                    message: resultMessage || `${importedCount} kayıt başarıyla içe aktarıldı.`,
                });

                if (importedCount > 0) {
                    message.success(`${importedCount} menü öğesi başarıyla içe aktarıldı!`);
                    if (onComplete) {
                        onComplete();
                    }
                }
            } else {
                setUploadResult({
                    success: true,
                    importedCount: 0,
                    message: 'İçe aktarma tamamlandı.',
                });
            }
        } catch (error) {
            console.error('Excel import hatası:', error);

            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message || getErrorMessage(statusCode);

            setUploadResult({
                success: false,
                message: errorMessage,
            });
            message.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    /**
     * Excel dışa aktarma işlemi
     */
    const handleExport = async () => {
        setDownloading(true);

        try {
            const response = await axiosInstance.get(
                EXCEL_EXPORT_API,
                {
                    responseType: 'blob',
                }
            );

            // Dosyayı indir
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

            message.success('Excel dosyası başarıyla indirildi!');
        } catch (error) {
            console.error('Excel export hatası:', error);
            const statusCode = error.response?.status;
            message.error(getErrorMessage(statusCode));
        } finally {
            setDownloading(false);
        }
    };

    /**
     * Dosya kaldırma
     */
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setUploadProgress(0);
    };

    /**
     * Modal kapatma
     */
    const handleClose = () => {
        if (!uploading && !downloading) {
            onClose();
        }
    };

    /**
     * Şablon bilgileri
     */
    const templateInfo = [
        { column: 'Tarih', description: 'Menü tarihi (GG.AA.YYYY)', required: true, example: '25.12.2024' },
        { column: 'Öğün', description: 'Öğle veya Akşam (1 veya 2)', required: true, example: '1' },
        { column: 'Yemek Adı', description: 'Yemeğin adı', required: true, example: 'Mercimek Çorbası' },
        { column: 'Kategori', description: 'Yemek kategorisi', required: true, example: 'ÇORBA' },
        { column: 'Kalori', description: 'Kalori değeri (kcal)', required: false, example: '150' },
    ];

    return (
        <Modal
            title={
                <Space>
                    <FileExcelOutlined style={{ color: '#217346' }} />
                    <span>Excel İşlemleri</span>
                </Space>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={700}
            destroyOnClose
            maskClosable={!uploading && !downloading}
            closable={!uploading && !downloading}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                {/* İçe Aktarma Tab */}
                <TabPane
                    tab={
                        <span>
                            <UploadOutlined /> İçe Aktar
                        </span>
                    }
                    key="import"
                >
                    {/* Sonuç Gösterimi */}
                    {uploadResult ? (
                        <Result
                            status={uploadResult.success ? 'success' : 'error'}
                            title={uploadResult.success ? 'İçe Aktarma Tamamlandı' : 'İçe Aktarma Başarısız'}
                            subTitle={uploadResult.message}
                            extra={
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {uploadResult.success && uploadResult.importedCount > 0 && (
                                        <Row gutter={16} justify="center">
                                            <Col>
                                                <Card size="small">
                                                    <Statistic
                                                        title="Başarılı"
                                                        value={uploadResult.importedCount}
                                                        valueStyle={{ color: '#3f8600' }}
                                                        prefix={<CheckCircleOutlined />}
                                                    />
                                                </Card>
                                            </Col>
                                            {uploadResult.errorCount > 0 && (
                                                <Col>
                                                    <Card size="small">
                                                        <Statistic
                                                            title="Hatalı"
                                                            value={uploadResult.errorCount}
                                                            valueStyle={{ color: '#cf1322' }}
                                                            prefix={<CloseCircleOutlined />}
                                                        />
                                                    </Card>
                                                </Col>
                                            )}
                                        </Row>
                                    )}

                                    {/* Hata Listesi */}
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <Alert
                                            type="warning"
                                            message="Hatalar"
                                            description={
                                                <List
                                                    size="small"
                                                    dataSource={uploadResult.errors.slice(0, 10)}
                                                    renderItem={(error) => (
                                                        <List.Item>
                                                            <Text type="danger">{error}</Text>
                                                        </List.Item>
                                                    )}
                                                />
                                            }
                                        />
                                    )}

                                    <Space>
                                        <Button onClick={resetStates}>Yeni Yükleme</Button>
                                        <Button type="primary" onClick={handleClose}>
                                            Kapat
                                        </Button>
                                    </Space>
                                </Space>
                            }
                        />
                    ) : (
                        <>
                            {/* Şablon Bilgileri */}
                            <Alert
                                message="Dosya Formatı Bilgisi"
                                description={
                                    <div>
                                        <Paragraph>
                                            Excel dosyanızın aşağıdaki kolonları içermesi gerekmektedir:
                                        </Paragraph>
                                        <List
                                            size="small"
                                            dataSource={templateInfo}
                                            renderItem={(item) => (
                                                <List.Item>
                                                    <Space>
                                                        <Tag color={item.required ? 'red' : 'default'}>
                                                            {item.required ? 'Zorunlu' : 'Opsiyonel'}
                                                        </Tag>
                                                        <Text strong>{item.column}:</Text>
                                                        <Text>{item.description}</Text>
                                                        <Text type="secondary">(Örn: {item.example})</Text>
                                                    </Space>
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                }
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                                className="mb-4"
                            />

                            {/* Dosya Yükleme Alanı */}
                            <Dragger
                                name="file"
                                multiple={false}
                                beforeUpload={beforeUpload}
                                onRemove={handleRemoveFile}
                                fileList={selectedFile ? [selectedFile] : []}
                                accept=".xlsx,.xls"
                                disabled={uploading}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    Dosyayı buraya sürükleyin veya tıklayarak seçin
                                </p>
                                <p className="ant-upload-hint">
                                    Sadece .xlsx ve .xls dosyaları desteklenir (Maks: 10MB)
                                </p>
                            </Dragger>

                            {/* Progress Bar */}
                            {uploading && (
                                <div style={{ marginTop: 16 }}>
                                    <Text>Yükleniyor...</Text>
                                    <Progress percent={uploadProgress} status="active" />
                                </div>
                            )}

                            <Divider />

                            <Row justify="end" gutter={8}>
                                <Col>
                                    <Button onClick={handleClose} disabled={uploading}>
                                        İptal
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        type="primary"
                                        onClick={handleUpload}
                                        loading={uploading}
                                        disabled={!selectedFile}
                                        icon={<UploadOutlined />}
                                    >
                                        {uploading ? 'Yükleniyor...' : 'İçe Aktar'}
                                    </Button>
                                </Col>
                            </Row>
                        </>
                    )}
                </TabPane>

                {/* Dışa Aktarma Tab */}
                <TabPane
                    tab={
                        <span>
                            <DownloadOutlined /> Dışa Aktar
                        </span>
                    }
                    key="export"
                >
                    <Card>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Excel Dışa Aktarma"
                                description="Mevcut menüleri Excel formatında indirmek için aşağıdaki butona tıklayın."
                                type="info"
                                showIcon
                            />

                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <FileExcelOutlined
                                    style={{ fontSize: 64, color: '#217346', marginBottom: 16 }}
                                />
                                <br />
                                <Text type="secondary">
                                    Tüm menü verileri Excel dosyası olarak indirilecektir.
                                </Text>
                            </div>

                            <Divider />

                            <Row justify="center">
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleExport}
                                    loading={downloading}
                                    icon={<DownloadOutlined />}
                                >
                                    {downloading ? 'İndiriliyor...' : 'Excel Olarak İndir'}
                                </Button>
                            </Row>
                        </Space>
                    </Card>
                </TabPane>
            </Tabs>
        </Modal>
    );
};

export default ExcelModule;