import React, { useState } from 'react';
import { Card, Upload, Button, Alert, Progress, Table, Typography, Space, Tag, Divider, List, message } from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { canManageMenu } from '@/constants/yemekhaneRoutes';
import * as excelService from '@/services/excelService';
import { MEAL_CATEGORIES, MEAL_TIME_LABELS, MEAL_TIMES } from '@/constants/mealMenuApi';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const ExcelUpload = () => {
    const { user } = useAuth();

    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [validationError, setValidationError] = useState(null);

    // Check permissions
    const hasPermission = canManageMenu(user);

    // Sample data for template info
    const templateColumns = [
        { title: 'Yemek Adı', dataIndex: 'foodName', example: 'Mercimek Çorbası' },
        { title: 'Kategori', dataIndex: 'category', example: 'ÇORBA' },
        { title: 'Kalori', dataIndex: 'calorie', example: '120' },
        { title: 'Tarih', dataIndex: 'menuDate', example: '2024-01-15' },
        { title: 'Öğün', dataIndex: 'mealTime', example: '1 (Öğle) veya 2 (Akşam)' },
    ];

    // Handle file selection
    const handleFileSelect = (file) => {
        // Reset states
        setUploadResult(null);
        setValidationError(null);
        setUploadProgress(0);

        // Validate file extension
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isExcel) {
            setValidationError('Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir');
            return false;
        }

        // Validate file size (max 10MB)
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            setValidationError('Dosya boyutu 10MB\'dan küçük olmalıdır');
            return false;
        }

        setSelectedFile(file);
        return false; // Prevent auto upload
    };

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile) {
            message.warning('Lütfen bir dosya seçin');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);
        setValidationError(null);

        try {
            const result = await excelService.importFromExcel(selectedFile, (progress) => {
                setUploadProgress(progress);
            });

            setUploadResult({
                success: true,
                successCount: result?.successCount || 0,
                errorCount: result?.errorCount || 0,
                errors: result?.errors || []
            });

            if (result?.successCount > 0) {
                message.success(`${result.successCount} menü öğesi başarıyla eklendi`);
            }

            setSelectedFile(null);
        } catch (error) {
            console.error('Yükleme hatası:', error);
            setUploadResult({
                success: false,
                errorMessage: error.response?.data?.message || error.message || 'Yükleme sırasında bir hata oluştu'
            });
            message.error('Yükleme başarısız');
        } finally {
            setUploading(false);
        }
    };

    // Handle template download
    const handleDownloadTemplate = async () => {
        try {
            await excelService.downloadTemplate();
            message.success('Şablon indirildi');
        } catch (error) {
            console.error('Şablon indirme hatası:', error);
            message.error('Şablon indirilemedi');
        }
    };

    // Reset upload
    const handleReset = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadResult(null);
        setValidationError(null);
    };

    // Permission check
    if (!hasPermission) {
        return (
            <Alert
                message="Yetkisiz Erişim"
                description="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır."
                type="error"
                showIcon
            />
        );
    }

    return (
        <div>
            <Title level={4}>Excel ile Menü Yükleme</Title>
            <Paragraph type="secondary">
                Excel dosyası kullanarak toplu menü ekleme yapabilirsiniz.
            </Paragraph>

            <Divider />

            {/* Template Info Card */}
            <Card title="Şablon Bilgileri" style={{ marginBottom: 24 }}>
                <Paragraph>
                    Excel dosyanız aşağıdaki sütunları içermelidir:
                </Paragraph>

                <Table
                    dataSource={templateColumns}
                    columns={[
                        { title: 'Sütun Adı', dataIndex: 'title', key: 'title' },
                        { title: 'Örnek Değer', dataIndex: 'example', key: 'example' }
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="dataIndex"
                    style={{ marginBottom: 16 }}
                />

                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Kategori Seçenekleri:</Text>
                    <Space wrap>
                        {MEAL_CATEGORIES.map(cat => (
                            <Tag key={cat.value} color={cat.color}>
                                {cat.icon} {cat.value}
                            </Tag>
                        ))}
                    </Space>
                </Space>

                <Divider />

                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadTemplate}
                >
                    Örnek Şablon İndir
                </Button>
            </Card>

            {/* Upload Card */}
            <Card title="Dosya Yükleme">
                {/* Validation Error */}
                {validationError && (
                    <Alert
                        message="Doğrulama Hatası"
                        description={validationError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setValidationError(null)}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Upload Result */}
                {uploadResult && (
                    <Alert
                        message={uploadResult.success ? 'Yükleme Tamamlandı' : 'Yükleme Başarısız'}
                        description={
                            uploadResult.success ? (
                                <div>
                                    <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> {uploadResult.successCount} öğe başarıyla eklendi</p>
                                    {uploadResult.errorCount > 0 && (
                                        <p><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> {uploadResult.errorCount} öğe eklenemedi</p>
                                    )}
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <List
                                            size="small"
                                            dataSource={uploadResult.errors.slice(0, 5)}
                                            renderItem={(error, index) => (
                                                <List.Item>
                                                    <Text type="danger">Satır {error.row}: {error.message}</Text>
                                                </List.Item>
                                            )}
                                        />
                                    )}
                                </div>
                            ) : (
                                <p>{uploadResult.errorMessage}</p>
                            )
                        }
                        type={uploadResult.success ? 'success' : 'error'}
                        showIcon
                        closable
                        onClose={handleReset}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Dragger */}
                <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={handleFileSelect}
                    onRemove={() => setSelectedFile(null)}
                    fileList={selectedFile ? [selectedFile] : []}
                    accept=".xlsx,.xls"
                    disabled={uploading}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">
                        Dosyayı buraya sürükleyin veya tıklayarak seçin
                    </p>
                    <p className="ant-upload-hint">
                        Sadece .xlsx ve .xls dosyaları desteklenir. Maksimum dosya boyutu: 10MB
                    </p>
                </Dragger>

                {/* Progress */}
                {uploading && (
                    <div style={{ marginTop: 16 }}>
                        <Progress percent={uploadProgress} status="active" />
                        <Text type="secondary">Yükleniyor...</Text>
                    </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={handleReset} disabled={uploading}>
                            Temizle
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            loading={uploading}
                            disabled={!selectedFile}
                            icon={<FileExcelOutlined />}
                        >
                            Yükle
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Instructions Card */}
            <Card title="Kullanım Talimatları" style={{ marginTop: 24 }}>
                <List
                    dataSource={[
                        'Önce "Örnek Şablon İndir" butonuna tıklayarak şablonu indirin',
                        'Excel dosyasını şablondaki formata uygun şekilde doldurun',
                        'Tarih formatı: YYYY-MM-DD (Örn: 2024-01-15)',
                        'Öğün değeri: 1 = Öğle, 2 = Akşam',
                        'Kategori değerleri: ÇORBA, ANA YEMEK, YARDIMCI YEMEK, SPESYEL SALATA, CORNER',
                        'Dosyayı yükleme alanına sürükleyin veya tıklayarak seçin',
                        '"Yükle" butonuna tıklayarak içe aktarmayı başlatın'
                    ]}
                    renderItem={(item, index) => (
                        <List.Item>
                            <Space>
                                <Tag color="blue">{index + 1}</Tag>
                                <Text>{item}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default ExcelUpload;