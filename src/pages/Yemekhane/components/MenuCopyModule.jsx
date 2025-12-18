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
                sourceCount: filteredMenus.length,
                targetExistingCount: targetMenus.length,
                copyLunch,
                copyDinner,
                overwriteExisting,
                sourceMenus: filteredMenus,
                targetMenus,
                sourceMonthStart,
                targetMonthStart
            });

            setStep('preview');
        } catch (error) {
            console.error('Önizleme yüklenirken hata:', error);
            message.error('Önizleme yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Execute copy
    const handleCopy = async () => {
        if (!previewData) return;

        setStep('copying');
        setProgress(0);
        setLoading(true);

        try {
            const { sourceMenus, targetMenus, overwriteExisting, sourceMonthStart, targetMonthStart } = previewData;

            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;
            const total = sourceMenus.length;

            for (let i = 0; i < sourceMenus.length; i++) {
                const menu = sourceMenus[i];

                try {
                    // Calculate new date (same day of month in target month)
                    const sourceDate = dayjs(menu.menuDate);
                    const dayOfMonth = sourceDate.date();
                    const targetMonthEndDay = targetMonthStart.endOf('month').date();

                    // Skip if day doesn't exist in target month
                    if (dayOfMonth > targetMonthEndDay) {
                        skipCount++;
                        continue;
                    }

                    const newDate = targetMonthStart.date(dayOfMonth).format('YYYY-MM-DD');

                    // Check if target already has this item
                    const existsInTarget = targetMenus.some(t =>
                        dayjs(t.menuDate).format('YYYY-MM-DD') === newDate &&
                        t.mealTime === menu.mealTime &&
                        t.foodName === menu.foodName
                    );

                    if (existsInTarget && !overwriteExisting) {
                        skipCount++;
                    } else {
                        // Create new menu item
                        await mealMenuService.createMenuItem({
                            foodName: menu.foodName,
                            category: menu.category,
                            calorie: menu.calorie,
                            menuDate: newDate,
                            mealTime: menu.mealTime
                        });
                        successCount++;
                    }
                } catch (err) {
                    console.error('Menü kopyalanırken hata:', err);
                    errorCount++;
                }

                // Update progress
                setProgress(Math.round(((i + 1) / total) * 100));
            }

            // Show result
            if (errorCount === 0) {
                message.success(`${successCount} menü başarıyla kopyalandı${skipCount > 0 ? `, ${skipCount} menü atlandı` : ''}`);
            } else {
                message.warning(`${successCount} kopyalandı, ${skipCount} atlandı, ${errorCount} hata oluştu`);
            }

            onCopyComplete?.();
            handleClose();
        } catch (error) {
            console.error('Kopyalama işlemi sırasında hata:', error);
            message.error('Kopyalama işlemi başarısız');
        } finally {
            setLoading(false);
        }
    };

    // Disable past months for target
    const disabledTargetDate = (current) => {
        const sourceMonth = form.getFieldValue('sourceMonth');
        if (sourceMonth && current) {
            return current.isSame(sourceMonth, 'month');
        }
        return false;
    };

    return (
        <Modal
            title={
                <Space>
                    <CopyOutlined />
                    <span>Menü Kopyala</span>
                </Space>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={500}
            destroyOnClose
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
                    <Alert
                        message="Menü Kopyalama"
                        description="Kaynak aydaki menüleri hedef aya kopyalayabilirsiniz. Aynı günlere denk gelen menüler kopyalanacaktır."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Form.Item
                        name="sourceMonth"
                        label="Kaynak Ay"
                        rules={[{ required: true, message: 'Kaynak ay seçin' }]}
                    >
                        <DatePicker
                            picker="month"
                            style={{ width: '100%' }}
                            placeholder="Kopyalanacak ay"
                            format="MMMM YYYY"
                        />
                    </Form.Item>

                    <div style={{ textAlign: 'center', margin: '16px 0' }}>
                        <SwapRightOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>

                    <Form.Item
                        name="targetMonth"
                        label="Hedef Ay"
                        rules={[{ required: true, message: 'Hedef ay seçin' }]}
                    >
                        <DatePicker
                            picker="month"
                            style={{ width: '100%' }}
                            placeholder="Kopyalanacağı ay"
                            format="MMMM YYYY"
                            disabledDate={disabledTargetDate}
                        />
                    </Form.Item>

                    <Divider />

                    <Form.Item label="Kopyalanacak Öğünler">
                        <Space direction="vertical">
                            <Form.Item name="copyLunch" valuePropName="checked" noStyle>
                                <Checkbox>🍽️ Öğle Yemeği</Checkbox>
                            </Form.Item>
                            <Form.Item name="copyDinner" valuePropName="checked" noStyle>
                                <Checkbox>🌙 Akşam Yemeği</Checkbox>
                            </Form.Item>
                        </Space>
                    </Form.Item>

                    <Form.Item name="overwriteExisting" valuePropName="checked">
                        <Checkbox>
                            <Text type="warning">
                                <WarningOutlined /> Mevcut menülerin üzerine yaz
                            </Text>
                        </Checkbox>
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleClose}>İptal</Button>
                            <Button type="primary" onClick={handlePreview} loading={loading}>
                                Önizle
                            </Button>
                        </Space>
                    </div>
                </Form>
            )}

            {step === 'preview' && previewData && (
                <div>
                    <Alert
                        message="Kopyalama Özeti"
                        description={
                            <div>
                                <p><strong>Kaynak:</strong> {previewData.sourceMonth} ({previewData.sourceCount} menü)</p>
                                <p><strong>Hedef:</strong> {previewData.targetMonth} ({previewData.targetExistingCount} mevcut menü)</p>
                                <p><strong>Öğünler:</strong> {[
                                    previewData.copyLunch && 'Öğle',
                                    previewData.copyDinner && 'Akşam'
                                ].filter(Boolean).join(', ')}</p>
                                <p><strong>Üzerine Yazma:</strong> {previewData.overwriteExisting ? 'Evet' : 'Hayır'}</p>
                            </div>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    {previewData.targetExistingCount > 0 && !previewData.overwriteExisting && (
                        <Alert
                            message="Uyarı"
                            description={`Hedef ayda ${previewData.targetExistingCount} mevcut menü var. Aynı gün ve öğündeki menüler atlanacaktır.`}
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setStep('select')}>Geri</Button>
                            <Button type="primary" onClick={handleCopy} loading={loading}>
                                Kopyalamayı Başlat
                            </Button>
                        </Space>
                    </div>
                </div>
            )}

            {step === 'copying' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Title level={4}>Kopyalanıyor...</Title>
                    <Progress
                        percent={progress}
                        status="active"
                        style={{ marginBottom: 24 }}
                    />
                    <Text type="secondary">Lütfen bekleyin, menüler kopyalanıyor.</Text>
                </div>
            )}
        </Modal>
    );
};

export default MenuCopyModule;