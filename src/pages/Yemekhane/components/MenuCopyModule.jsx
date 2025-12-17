import React, { useState } from 'react';
import { Modal, Form, DatePicker, Checkbox, Button, Space, Typography, Alert, Progress, message, Divider } from 'antd';
import { CopyOutlined, SwapRightOutlined, WarningOutlined } from '@ant-design/icons';
import mealMenuService from '@/services/mealMenuService';
import { MEAL_TIMES, MONTH_NAMES } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;

const MenuCopyModule = ({ visible, onClose, onCopyComplete }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewData, setPreviewData] = useState(null);
    const [step, setStep] = useState('select'); // 'select', 'preview', 'copying'

    // Reset state when modal closes
    const handleClose = () => {
        form.resetFields();
        setProgress(0);
        setPreviewData(null);
        setStep('select');
        onClose();
    };

    // Get month name
    const getMonthName = (dateString) => {
        const date = dayjs(dateString);
        return `${MONTH_NAMES[date.month()]} ${date.year()}`;
    };

    // Load preview data
    const handlePreview = async () => {
        try {
            const values = await form.validateFields();
            const { sourceMonth, targetMonth, copyLunch, copyDinner, overwriteExisting } = values;

            if (!copyLunch && !copyDinner) {
                message.warning('En az bir öğün türü seçmelisiniz');
                return;
            }

            setLoading(true);

            // Get source month data
            const sourceStart = dayjs(sourceMonth).startOf('month').format('YYYY-MM-DD');
            const sourceEnd = dayjs(sourceMonth).endOf('month').format('YYYY-MM-DD');

            const sourceResponse = await mealMenuService.getMenusByDateRange(sourceStart, sourceEnd);
            const sourceMenus = sourceResponse?.data || [];

            // Filter by meal time
            let filteredMenus = sourceMenus.filter(menu => {
                if (copyLunch && menu.mealTime === MEAL_TIMES.LUNCH) return true;
                if (copyDinner && menu.mealTime === MEAL_TIMES.DINNER) return true;
                return false;
            });

            if (filteredMenus.length === 0) {
                message.warning('Kaynak ayda kopyalanacak menü bulunamadı');
                setLoading(false);
                return;
            }

            // Check target month for existing data
            const targetStart = dayjs(targetMonth).startOf('month').format('YYYY-MM-DD');
            const targetEnd = dayjs(targetMonth).endOf('month').format('YYYY-MM-DD');

            const targetResponse = await mealMenuService.getMenusByDateRange(targetStart, targetEnd);
            const targetMenus = targetResponse?.data || [];

            // Calculate date offset (days between source and target month start)
            const sourceMonthStart = dayjs(sourceMonth).startOf('month');
            const targetMonthStart = dayjs(targetMonth).startOf('month');

            // Prepare preview
            setPreviewData({
                sourceMonth: getMonthName(sourceMonth),
                targetMonth: getMonthName(targetMonth),
                sourceMenuCount: filteredMenus.length,
                targetExistingCount: targetMenus.length,
                copyLunch,
                copyDinner,
                overwriteExisting,
                sourceMonthStart,
                targetMonthStart,
                filteredMenus
            });

            setStep('preview');
        } catch (error) {
            console.error('Önizleme yüklenirken hata:', error);
            message.error('Önizleme yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Execute copy operation
    const handleCopy = async () => {
        if (!previewData) return;

        setStep('copying');
        setProgress(0);

        const { filteredMenus, sourceMonthStart, targetMonthStart, overwriteExisting } = previewData;
        const totalItems = filteredMenus.length;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < filteredMenus.length; i++) {
            const menu = filteredMenus[i];

            try {
                // Calculate the day of month from source
                const sourceDate = dayjs(menu.menuDate);
                const dayOfMonth = sourceDate.date();

                // Calculate target date (same day of month in target month)
                let targetDate = targetMonthStart.date(dayOfMonth);

                // Handle edge cases (e.g., Feb 30 doesn't exist)
                const targetMonthEnd = targetMonthStart.endOf('month').date();
                if (dayOfMonth > targetMonthEnd) {
                    targetDate = targetMonthStart.endOf('month');
                }

                const newMenuData = {
                    foodName: menu.foodName,
                    category: menu.category,
                    calorie: menu.calorie,
                    menuDate: targetDate.format('YYYY-MM-DD'),
                    mealTime: menu.mealTime
                };

                await mealMenuService.createMenuItem(newMenuData);
                successCount++;
            } catch (error) {
                console.error('Menü kopyalanırken hata:', error);
                errorCount++;
            }

            setProgress(Math.round(((i + 1) / totalItems) * 100));
        }

        if (successCount > 0) {
            message.success(`${successCount} menü öğesi başarıyla kopyalandı`);
            onCopyComplete?.();
        }

        if (errorCount > 0) {
            message.warning(`${errorCount} menü öğesi kopyalanamadı`);
        }

        handleClose();
    };

    // Go back to select step
    const handleBack = () => {
        setPreviewData(null);
        setStep('select');
    };

    return (
        <Modal
            title={
                <Space>
                    <CopyOutlined />
                    <span>Menü Kopyalama</span>
                </Space>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={600}
        >
            {step === 'select' && (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        copyLunch: true,
                        copyDinner: true,
                        overwriteExisting: false
                    }}
                >
                    <Form.Item
                        name="sourceMonth"
                        label="Kaynak Ay"
                        rules={[{ required: true, message: 'Kaynak ay seçin' }]}
                    >
                        <DatePicker
                            picker="month"
                            style={{ width: '100%' }}
                            placeholder="Kopyalanacak menülerin bulunduğu ay"
                            format="MMMM YYYY"
                        />
                    </Form.Item>

                    <Form.Item
                        name="targetMonth"
                        label="Hedef Ay"
                        rules={[{ required: true, message: 'Hedef ay seçin' }]}
                    >
                        <DatePicker
                            picker="month"
                            style={{ width: '100%' }}
                            placeholder="Menülerin kopyalanacağı ay"
                            format="MMMM YYYY"
                        />
                    </Form.Item>

                    <Divider>Kopyalanacak Öğünler</Divider>

                    <Space size="large">
                        <Form.Item name="copyLunch" valuePropName="checked" noStyle>
                            <Checkbox>Öğle Yemeği</Checkbox>
                        </Form.Item>
                        <Form.Item name="copyDinner" valuePropName="checked" noStyle>
                            <Checkbox>Akşam Yemeği</Checkbox>
                        </Form.Item>
                    </Space>

                    <Divider />

                    <Form.Item name="overwriteExisting" valuePropName="checked">
                        <Checkbox>
                            <Text type="warning">
                                <WarningOutlined /> Mevcut menülerin üzerine yaz
                            </Text>
                        </Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={handleClose}>İptal</Button>
                            <Button type="primary" onClick={handlePreview} loading={loading}>
                                Önizle
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            )}

            {step === 'preview' && previewData && (
                <div>
                    <Alert
                        type="info"
                        message="Kopyalama Özeti"
                        description={
                            <div>
                                <p>
                                    <strong>{previewData.sourceMonth}</strong> ayından{' '}
                                    <SwapRightOutlined />{' '}
                                    <strong>{previewData.targetMonth}</strong> ayına kopyalanacak
                                </p>
                                <p>Kopyalanacak menü sayısı: <strong>{previewData.sourceMenuCount}</strong></p>
                                <p>
                                    Öğünler:{' '}
                                    {previewData.copyLunch && <Text code>Öğle</Text>}
                                    {previewData.copyLunch && previewData.copyDinner && ' + '}
                                    {previewData.copyDinner && <Text code>Akşam</Text>}
                                </p>
                                {previewData.targetExistingCount > 0 && (
                                    <p>
                                        <WarningOutlined style={{ color: '#faad14' }} />{' '}
                                        Hedef ayda {previewData.targetExistingCount} mevcut menü var
                                    </p>
                                )}
                            </div>
                        }
                        style={{ marginBottom: 24 }}
                    />

                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={handleBack}>Geri</Button>
                        <Button type="primary" onClick={handleCopy}>
                            Kopyalamayı Başlat
                        </Button>
                    </Space>
                </div>
            )}

            {step === 'copying' && (
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <Title level={4}>Menüler Kopyalanıyor...</Title>
                    <Progress percent={progress} status="active" />
                    <Text type="secondary">Lütfen bekleyin, bu işlem biraz zaman alabilir.</Text>
                </div>
            )}
        </Modal>
    );
};

export default MenuCopyModule;