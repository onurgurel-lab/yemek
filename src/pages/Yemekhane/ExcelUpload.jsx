import React, { useState } from 'react';
import { Card, Upload, Button, Alert, Progress, Table, Typography, Space, Tag, Divider, List, message } from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import excelService from '@/services/excelService';
import { MEAL_CATEGORIES, MEAL_TIME_LABELS, MEAL_TIMES } from '@/constants/mealMenuApi';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const ExcelUpload = () => {
    const { user } = useAuth();
    const { canManageMenu } = useUserRoles();

    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [validationError, setValidationError] = useState(null);

    // Check permissions - useUserRoles hook'undan alınan canManageMenu kullanılıyor
    const hasPermission = canManageMenu;

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
                message.error('Yükleme başarısız');
            }
        } catch (error) {
            message.error(error?.message || 'Yükleme sırasında bir hata oluştu');
            setUploadResult({
                success: false,
                message: error?.message || 'Yükleme başarısız',
                successCount: 0,
                errorCount: 1,
                errors: [error?.message || 'Bilinmeyen hata']
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle template download
    const handleDownloadTemplate = async () => {
        try {
            await excelService.downloadTemplate();
            message.success('Şablon indiriliyor...');
        } catch (error) {
            message.error('Şablon indirilemedi');
        }
    };

    // Clear selection
    const handleClear = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setValidationError(null);
        setUploadProgress(0);
    };

    // Template columns info
    const templateColumns = [
        { title: 'Kolon', dataIndex: 'column', key: 'column' },
        { title: 'Açıklama', dataIndex: 'description', key: 'description' },
        { title: 'Zorunlu', dataIndex: 'required', key: 'required', render: (val) => val ? <Tag color="red">Evet</Tag> : <Tag>Hayır</Tag> },
        { title: 'Örnek', dataIndex: 'example', key: 'example' },
    ];

    const templateData = [
        { key: '1', column: 'Tarih', description: 'Menü tarihi (GG.AA.YYYY)', required: true, example: '25.12.2024' },
        { key: '2', column: 'Öğün', description: 'Öğle veya Akşam', required: true, example: 'Öğle' },
        { key: '3', column: 'Yemek Adı', description: 'Yemeğin adı', required: true, example: 'Mercimek Çorbası' },
        { key: '4', column: 'Kategori', description: 'Yemek kategorisi', required: true, example: 'ÇORBA' },
        { key: '5', column: 'Kalori', description: 'Kalori değeri (kcal)', required: false, example: '150' },
    ];

    // Permission check
    if (!hasPermission) {
        return (
            <Card>
                <Alert
                    message="Yetkisiz Erişim"
                    description="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır."
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <div className="excel-upload">
            <Card title={<Title level={4}>Excel ile Menü Yükle</Title>}>
                {/* Template Info */}
                <Alert
                    message="Excel Şablonu Hakkında"
                    description={
                        <div>
                            <Paragraph>
                                Menü verilerini toplu olarak yüklemek için Excel şablonunu kullanabilirsiniz.
                                Şablonu indirip doldurduktan sonra bu sayfadan yükleyebilirsiniz.
                            </Paragraph>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadTemplate}
                            >
                                Şablonu İndir
                            </Button>
                        </div>
                    }
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined />}
                    style={{ marginBottom: 24 }}
                />

                {/* Template Structure */}
                <Card type="inner" title="Şablon Yapısı" style={{ marginBottom: 24 }}>
                    <Table
                        columns={templateColumns}
                        dataSource={templateData}
                        pagination={false}
                        size="small"
                    />

                    <Divider />

                    <Title level={5}>Geçerli Kategoriler:</Title>
                    <Space wrap>
                        {MEAL_CATEGORIES.map(cat => (
                            <Tag key={cat.value} color={cat.color}>
                                {cat.icon} {cat.label}
                            </Tag>
                        ))}
                    </Space>

                    <Divider />

                    <Title level={5}>Geçerli Öğün Değerleri:</Title>
                    <Space>
                        <Tag color="blue">{MEAL_TIME_LABELS[MEAL_TIMES.LUNCH]}</Tag>
                        <Tag color="orange">{MEAL_TIME_LABELS[MEAL_TIMES.DINNER]}</Tag>
                    </Space>
                </Card>

                {/* Upload Area */}
                <Card type="inner" title="Dosya Yükle" style={{ marginBottom: 24 }}>
                    <Dragger
                        accept=".xlsx,.xls"
                        beforeUpload={handleFileSelect}
                        showUploadList={false}
                        disabled={uploading}
                    >
                        <p className="ant-upload-drag-icon">
                            {selectedFile ? <FileExcelOutlined style={{ color: '#52c41a' }} /> : <InboxOutlined />}
                        </p>
                        <p className="ant-upload-text">
                            {selectedFile ? selectedFile.name : 'Excel dosyasını buraya sürükleyin veya tıklayın'}
                        </p>
                        <p className="ant-upload-hint">
                            Desteklenen formatlar: .xlsx, .xls (Maksimum 5MB)
                        </p>
                    </Dragger>

                    {/* Validation Error */}
                    {validationError && (
                        <Alert
                            message="Dosya Hatası"
                            description={validationError}
                            type="error"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    )}

                    {/* Upload Progress */}
                    {uploading && (
                        <div style={{ marginTop: 16 }}>
                            <Progress percent={uploadProgress} status="active" />
                            <Text type="secondary">Yükleniyor...</Text>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {selectedFile && !uploading && (
                        <Space style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                onClick={handleUpload}
                                loading={uploading}
                            >
                                Yükle
                            </Button>
                            <Button onClick={handleClear}>
                                Temizle
                            </Button>
                        </Space>
                    )}
                </Card>

                {/* Upload Result */}
                {uploadResult && (
                    <Card
                        type="inner"
                        title={
                            <Space>
                                {uploadResult.success ? (
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                ) : (
                                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                )}
                                Yükleme Sonucu
                            </Space>
                        }
                    >
                        <Alert
                            message={uploadResult.message}
                            type={uploadResult.success ? 'success' : 'error'}
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Space size="large">
                            <Statistic
                                title="Başarılı"
                                value={uploadResult.successCount}
                                valueStyle={{ color: '#52c41a' }}
                            />
                            <Statistic
                                title="Hatalı"
                                value={uploadResult.errorCount}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Space>

                        {/* Error List */}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <>
                                <Divider />
                                <Title level={5}>Hatalar:</Title>
                                <List
                                    size="small"
                                    dataSource={uploadResult.errors}
                                    renderItem={(error, index) => (
                                        <List.Item>
                                            <Text type="danger">
                                                {index + 1}. {error}
                                            </Text>
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}
                    </Card>
                )}
            </Card>
        </div>
    );
};

// Statistic component helper
const Statistic = ({ title, value, valueStyle }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#666' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>{value}</div>
    </div>
);

export default ExcelUpload;