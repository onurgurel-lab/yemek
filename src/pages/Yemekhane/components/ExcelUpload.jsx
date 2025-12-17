import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Upload,
  Button,
  Alert,
  Table,
  Space,
  Progress,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Result,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

import { useNotification } from '@/hooks/useNotification';
import { fetchTodayMenu } from '@/store/slices/yemekhaneSlice';
import {
  importFromExcel,
  validateFile,
  getTemplateInfo,
  exportToExcel,
} from '@/services/excelService';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const ExcelUpload = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showSuccess, showError, showWarning } = useNotification();

  // Local state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  // Template info
  const templateInfo = getTemplateInfo();

  // Handle file selection
  const handleFileSelect = async (file) => {
    setPreviewData(null);
    setValidationErrors([]);
    setUploadResult(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      showError(validation.error);
      return false;
    }

    // Parse and preview
    try {
      setUploading(true);
      setUploadProgress(30);

      // Simulated preview - in real app, parse Excel here
      const mockPreview = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        rowCount: 15,
        dateRange: '01.01.2024 - 31.01.2024',
        items: [
          { row: 1, date: '2024-01-01', mealTime: 'breakfast', foodName: 'Menemen', status: 'valid' },
          { row: 2, date: '2024-01-01', mealTime: 'breakfast', foodName: 'Sucuklu Yumurta', status: 'valid' },
          { row: 3, date: '2024-01-01', mealTime: 'lunch', foodName: 'Mercimek Çorbası', status: 'valid' },
        ],
      };

      setUploadProgress(60);
      setPreviewData(mockPreview);
      setUploadProgress(100);
    } catch (error) {
      showError(error.message || t('yemekhane.parseError'));
    } finally {
      setUploading(false);
    }

    return false; // Prevent auto upload
  };

  // Handle upload confirmation
  const handleUpload = async () => {
    if (!previewData) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulated upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Call API
      const result = await importFromExcel(previewData);

      setUploadResult({
        success: true,
        totalRows: result.totalRows || 15,
        successCount: result.successCount || 14,
        errorCount: result.errorCount || 1,
        errors: result.errors || [
          { row: 5, message: 'Geçersiz tarih formatı' },
        ],
      });

      showSuccess(t('yemekhane.uploadSuccess'));
      dispatch(fetchTodayMenu());
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.message || t('yemekhane.uploadError'),
      });
      showError(error.message || t('yemekhane.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      await exportToExcel([], 'menu_template.xlsx');
      showSuccess(t('yemekhane.templateDownloaded'));
    } catch (error) {
      showError(error.message || t('messages.error'));
    }
  };

  // Reset form
  const handleReset = () => {
    setPreviewData(null);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);
  };

  // Preview table columns
  const previewColumns = [
    {
      title: t('yemekhane.row'),
      dataIndex: 'row',
      key: 'row',
      width: 60,
    },
    {
      title: t('yemekhane.date'),
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
    {
      title: t('yemekhane.mealTime'),
      dataIndex: 'mealTime',
      key: 'mealTime',
      width: 100,
      render: (mealTime) => t(`yemekhane.mealTimes.${mealTime}`),
    },
    {
      title: t('yemekhane.foodName'),
      dataIndex: 'foodName',
      key: 'foodName',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'valid' ? 'green' : 'red'}>
          {status === 'valid' ? t('common.valid') : t('common.invalid')}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Instructions Card */}
      <Card>
        <Title level={5}>
          <InfoCircleOutlined className="mr-2" />
          {t('yemekhane.uploadInstructions')}
        </Title>
        <Paragraph type="secondary">
          {t('yemekhane.uploadDescription')}
        </Paragraph>

        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={12}>
            <Card size="small" title={t('yemekhane.requiredColumns')}>
              <ul className="list-disc list-inside text-sm">
                {templateInfo.requiredColumns.map((col, index) => (
                  <li key={index}>{col}</li>
                ))}
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title={t('yemekhane.optionalColumns')}>
              <ul className="list-disc list-inside text-sm">
                {templateInfo.optionalColumns.map((col, index) => (
                  <li key={index}>{col}</li>
                ))}
              </ul>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
        >
          {t('yemekhane.downloadTemplate')}
        </Button>
      </Card>

      {/* Upload Area */}
      {!uploadResult && (
        <Card>
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleFileSelect}
            showUploadList={false}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            </p>
            <p className="ant-upload-text">{t('yemekhane.dragFile')}</p>
            <p className="ant-upload-hint">{t('yemekhane.supportedFormats')}</p>
          </Dragger>

          {uploading && (
            <Progress percent={uploadProgress} className="mt-4" />
          )}
        </Card>
      )}

      {/* Preview Card */}
      {previewData && !uploadResult && (
        <Card
          title={t('yemekhane.preview')}
          extra={
            <Space>
              <Button onClick={handleReset}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUpload}
                loading={uploading}
              >
                {t('yemekhane.confirmUpload')}
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={6}>
              <Text type="secondary">{t('yemekhane.fileName')}:</Text>
              <br />
              <Text strong>{previewData.fileName}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">{t('yemekhane.fileSize')}:</Text>
              <br />
              <Text strong>{previewData.fileSize}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">{t('yemekhane.rowCount')}:</Text>
              <br />
              <Text strong>{previewData.rowCount}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">{t('yemekhane.dateRange')}:</Text>
              <br />
              <Text strong>{previewData.dateRange}</Text>
            </Col>
          </Row>

          <Table
            columns={previewColumns}
            dataSource={previewData.items}
            rowKey="row"
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
        </Card>
      )}

      {/* Result Card */}
      {uploadResult && (
        <Card>
          {uploadResult.success ? (
            <Result
              status="success"
              title={t('yemekhane.uploadComplete')}
              subTitle={
                <Space direction="vertical">
                  <Text>
                    {t('yemekhane.totalRows')}: {uploadResult.totalRows}
                  </Text>
                  <Text type="success">
                    <CheckCircleOutlined /> {t('yemekhane.successCount')}:{' '}
                    {uploadResult.successCount}
                  </Text>
                  {uploadResult.errorCount > 0 && (
                    <Text type="danger">
                      <CloseCircleOutlined /> {t('yemekhane.errorCount')}:{' '}
                      {uploadResult.errorCount}
                    </Text>
                  )}
                </Space>
              }
              extra={
                <Button type="primary" onClick={handleReset}>
                  {t('yemekhane.uploadAnother')}
                </Button>
              }
            />
          ) : (
            <Result
              status="error"
              title={t('yemekhane.uploadFailed')}
              subTitle={uploadResult.message}
              extra={
                <Button type="primary" onClick={handleReset}>
                  {t('common.tryAgain')}
                </Button>
              }
            />
          )}

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={t('yemekhane.uploadErrors')}
              description={
                <ul className="list-disc list-inside mt-2">
                  {uploadResult.errors.map((err, index) => (
                    <li key={index}>
                      {t('yemekhane.row')} {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              }
              className="mt-4"
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default ExcelUpload;
