import React, { useState } from 'react';
import { Card, Upload, Button, Alert, Progress, Table, Typography, Space, Tag, Divider, List, message } from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { canManageMenu } from '@/routes/yemekhaneRoutes';
import { excelService } from '@/services/excelService';
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

    // Template info
    const templateInfo = excelService.getTemplateInfo();
    const sampleData = excelService.generateSampleData();

    // Handle file selection
    const handleFileSelect = (file) => {
        // Reset states
        setUploadResult(null);
        setValidationError(null);
        setUploadProgress(0);

        // Validate file
        const validation = excelService.validateFile(file);
        if (!validation.valid) {
            setValidationError(validation.error);
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

            const formattedResult = excelService.formatImportResult(result);
            setUploadResult(formattedResult);

            if (formattedResult.success) {
                message.success(`${formattedResult.successCount} menü öğesi başarıyla eklendi`);
            } else if (formattedResult.successCount > 0) {
                message.warning(`${formattedResult.successCount} öğe eklendi, ${formattedResult.errorCount} hata oluştu`);
            } else {
                message.error('İçe aktarma başarısız');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadResult({
                success: false,
                successCount: 0,
                errorCount: 1,
                errors: [error.message || 'Beklenmeyen bir hata oluştu']
            });
        } finally {
            setUploading(false);
        }
    };

    // Clear selected file
    const clearFile = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setValidationError(null);
        setUploadProgress(0);
    };

    // Download template
    const handleDownloadTemplate = async () => {
        try {
            await excelService.downloadTemplate();
            message.success('Şablon indirildi');
        } catch (error) {
            console.error('Template download error:', error);
            message.error('Şablon indirilemedi');
        }
    };

    // Template columns table
    const templateColumns = [
        { title: 'Sütun Adı', dataIndex: 'name', key: 'name' },
        { title: 'Açıklama', dataIndex: 'description', key: 'description' },
        {
            title: 'Zorunlu',
            dataIndex: 'required',
            key: 'required',
            render: (required) => required ? (
                <Tag color="red">Zorunlu</Tag>
            ) : (
                <Tag color="default">Opsiyonel</Tag>
            )
        }
    ];

    // Sample data columns
    const sampleColumns = [
        { title: 'Yemek Adı', dataIndex: 'foodName', key: 'foodName' },
        { title: 'Kategori', dataIndex: 'category', key: 'category' },
        { title: 'Kalori', dataIndex: 'calorie', key: 'calorie' },
        { title: 'Tarih', dataIndex: 'menuDate', key: 'menuDate' },
        { title: 'Öğün', dataIndex: 'mealTime', key: 'mealTime' }
    ];

    if (!hasPermission) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    message="Yetkisiz Erişim"
                    description="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Title level={3}>
                    <FileExcelOutlined style={{ marginRight: 8 }} />
                    Excel ile Menü Yükleme
                </Title>
                <Paragraph type="secondary">
                    Excel dosyası kullanarak toplu menü ekleyebilirsiniz.
                </Paragraph>

                {/* Upload Area */}
                <div style={{ marginBottom: 24 }}>
                    <Dragger
                        accept=".xlsx,.xls"
                        beforeUpload={handleFileSelect}
                        showUploadList={false}
                        disabled={uploading}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                        </p>
                        <p className="ant-upload-text">
                            Dosyayı sürükleyip bırakın veya tıklayarak seçin
                        </p>
                        <p className="ant-upload-hint">
                            Sadece .xlsx ve .xls dosyaları desteklenir (Maks. 10MB)
                        </p>
                    </Dragger>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                    <Alert
                        message={
                            <Space>
                                <FileExcelOutlined />
                                <span>{selectedFile.name}</span>
                                <Text type="secondary">
                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </Text>
                            </Space>
                        }
                        type="info"
                        showIcon={false}
                        closable
                        onClose={clearFile}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Validation Error */}
                {validationError && (
                    <Alert
                        message="Dosya Hatası"
                        description={validationError}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Upload Button */}
                <Space style={{ marginBottom: 24 }}>
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        loading={uploading}
                        disabled={!selectedFile || validationError}
                        icon={<FileExcelOutlined />}
                    >
                        Yükle ve İçe Aktar
                    </Button>
                    <Button
                        onClick={handleDownloadTemplate}
                        icon={<DownloadOutlined />}
                    >
                        Şablon İndir
                    </Button>
                </Space>

                {/* Progress */}
                {uploading && (
                    <div style={{ marginBottom: 24 }}>
                        <Progress percent={uploadProgress} status="active" />
                        <Text type="secondary">Menüler içe aktarılıyor...</Text>
                    </div>
                )}

                {/* Upload Result */}
                {uploadResult && (
                    <Alert
                        message={uploadResult.success ? 'İçe Aktarma Başarılı' : 'İçe Aktarma Tamamlandı'}
                        description={
                            <div>
                                <Space direction="vertical">
                                    <Text>
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                        Başarılı: {uploadResult.successCount} öğe
                                    </Text>
                                    {uploadResult.errorCount > 0 && (
                                        <>
                                            <Text>
                                                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                                                Hatalı: {uploadResult.errorCount} öğe
                                            </Text>
                                            <div style={{ maxHeight: 150, overflow: 'auto', marginTop: 8 }}>
                                                {uploadResult.errors.slice(0, 10).map((error, idx) => (
                                                    <div key={idx} style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                        • {error}
                                                    </div>
                                                ))}
                                                {uploadResult.errors.length > 10 && (
                                                    <Text type="secondary">
                                                        +{uploadResult.errors.length - 10} hata daha...
                                                    </Text>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Space>
                            </div>
                        }
                        type={uploadResult.success ? 'success' : 'warning'}
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Divider />

                {/* Template Documentation */}
                <Title level={4}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} />
                    Şablon Formatı
                </Title>

                {/* Required Columns */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Gerekli Sütunlar:
                    </Text>
                    <Table
                        dataSource={templateInfo.columns}
                        columns={templateColumns}
                        pagination={false}
                        size="small"
                        rowKey="name"
                    />
                </div>

                {/* Valid Categories */}
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Geçerli Kategoriler:
                    </Text>
                    <Space wrap>
                        {MEAL_CATEGORIES.map(cat => (
                            <Tag key={cat.label} color={cat.color}>
                                {cat.icon} {cat.label}
                            </Tag>
                        ))}
                    </Space>
                </div>

                {/* Valid Meal Times */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Geçerli Öğün Değerleri:
                    </Text>
                    <Space>
                        <Tag>Öğle veya {MEAL_TIMES.LUNCH}</Tag>
                        <Tag>Akşam veya {MEAL_TIMES.DINNER}</Tag>
                    </Space>
                </div>

                {/* Important Notes */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Önemli Notlar:
                    </Text>
                    <List
                        size="small"
                        dataSource={templateInfo.notes}
                        renderItem={(item) => (
                            <List.Item style={{ padding: '4px 0' }}>
                                <Text type="secondary">• {item}</Text>
                            </List.Item>
                        )}
                    />
                </div>

                {/* Sample Data */}
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Örnek Veri:
                    </Text>
                    <Table
                        dataSource={sampleData}
                        columns={sampleColumns}
                        pagination={false}
                        size="small"
                        rowKey={(record, index) => index}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default ExcelUpload;