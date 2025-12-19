/**
 * MenuCopyModule.jsx - Aylık Menü Kopyalama Modülü
 *
 * Eski projedeki MenuCopyModule'un Ant Design uyarlaması
 * Kaynak aydan hedef aya menü kopyalama işlemi
 *
 * @module pages/Yemekhane/components/MenuCopyModule
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    DatePicker,
    Checkbox,
    Button,
    Space,
    Alert,
    Progress,
    Typography,
    Divider,
    Row,
    Col,
    Card,
    Statistic,
    message,
    Result,
} from 'antd';
import {
    CopyOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import mealMenuService from '@/services/mealMenuService';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;

/**
 * MenuCopyModule Component
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma fonksiyonu
 * @param {Function} props.onComplete - Kopyalama tamamlandığında çağrılacak fonksiyon
 */
const MenuCopyModule = ({ visible, onClose, onComplete }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copyResult, setCopyResult] = useState(null);
    const [sourceMenuCount, setSourceMenuCount] = useState(0);
    const [checkingSource, setCheckingSource] = useState(false);

    /**
     * Modal kapanınca state'leri sıfırla
     */
    useEffect(() => {
        if (!visible) {
            form.resetFields();
            setProgress(0);
            setCopyResult(null);
            setSourceMenuCount(0);
        }
    }, [visible, form]);

    /**
     * Kaynak ay değiştiğinde menü sayısını kontrol et
     */
    const handleSourceMonthChange = async (date) => {
        if (!date) {
            setSourceMenuCount(0);
            return;
        }

        setCheckingSource(true);
        try {
            const yearMonth = date.format('YYYY-MM');
            const year = parseInt(yearMonth.substring(0, 4));
            const month = parseInt(yearMonth.substring(5, 7)) - 1;
            const menus = await mealMenuService.getMenusByMonth(year, month);
            setSourceMenuCount(Array.isArray(menus) ? menus.length : 0);
        } catch (error) {
            console.error('Kaynak menü kontrolü hatası:', error);
            setSourceMenuCount(0);
        } finally {
            setCheckingSource(false);
        }
    };

    /**
     * Kopyalama işlemi
     */
    const handleCopy = async (values) => {
        const { sourceMonth, targetMonth, includeLunch, includeDinner, overwriteExisting } = values;

        // Validasyonlar
        if (!sourceMonth || !targetMonth) {
            message.warning('Lütfen kaynak ve hedef ayları seçin.');
            return;
        }

        const sourceYM = sourceMonth.format('YYYY-MM');
        const targetYM = targetMonth.format('YYYY-MM');

        if (sourceYM === targetYM) {
            message.warning('Kaynak ve hedef ay aynı olamaz.');
            return;
        }

        if (!includeLunch && !includeDinner) {
            message.warning('En az bir öğün türü seçmelisiniz.');
            return;
        }

        setLoading(true);
        setProgress(0);
        setCopyResult(null);

        try {
            // Kaynak ayın menülerini al
            const sourceYear = parseInt(sourceYM.substring(0, 4));
            const sourceMonthNum = parseInt(sourceYM.substring(5, 7)) - 1;
            const sourceMenus = await mealMenuService.getMenusByMonth(sourceYear, sourceMonthNum);

            if (!sourceMenus || sourceMenus.length === 0) {
                setCopyResult({
                    success: false,
                    message: 'Kaynak ayda kopyalanacak menü bulunamadı.',
                });
                setLoading(false);
                return;
            }

            // Öğün filtreleme
            const filteredMenus = sourceMenus.filter((menu) => {
                if (!includeLunch && menu.mealTime === 1) return false;
                if (!includeDinner && menu.mealTime === 2) return false;
                return true;
            });

            if (filteredMenus.length === 0) {
                setCopyResult({
                    success: false,
                    message: 'Seçilen öğün türlerine göre kopyalanacak menü bulunamadı.',
                });
                setLoading(false);
                return;
            }

            // Hedef ayın mevcut menülerini kontrol et
            if (!overwriteExisting) {
                const targetYear = parseInt(targetYM.substring(0, 4));
                const targetMonthNum = parseInt(targetYM.substring(5, 7)) - 1;
                const targetMenus = await mealMenuService.getMenusByMonth(targetYear, targetMonthNum);

                if (targetMenus && targetMenus.length > 0) {
                    const confirmResult = await new Promise((resolve) => {
                        Modal.confirm({
                            title: 'Uyarı',
                            content: `Hedef ayda (${targetMonth.format('MMMM YYYY')}) zaten ${targetMenus.length} menü mevcut. Devam etmek istiyor musunuz?`,
                            okText: 'Evet, Devam Et',
                            cancelText: 'İptal',
                            onOk: () => resolve(true),
                            onCancel: () => resolve(false),
                        });
                    });

                    if (!confirmResult) {
                        setLoading(false);
                        return;
                    }
                }
            }

            // Kopyalama işlemi
            let copiedCount = 0;
            let errorCount = 0;
            const total = filteredMenus.length;

            for (let i = 0; i < filteredMenus.length; i++) {
                const menu = filteredMenus[i];

                try {
                    // Tarihi hedef aya göre ayarla
                    const sourceDate = dayjs(menu.menuDate);
                    const targetDate = sourceDate.month(targetMonth.month()).year(targetMonth.year());

                    const newMenu = {
                        foodName: menu.foodName,
                        category: menu.category,
                        calories: menu.calories,
                        mealTime: menu.mealTime,
                        menuDate: targetDate.format('YYYY-MM-DDTHH:mm:ss'),
                        notes: menu.notes || '',
                    };

                    await mealMenuService.createMenuItem(newMenu);
                    copiedCount++;
                } catch (error) {
                    console.error('Menü kopyalama hatası:', error);
                    errorCount++;
                }

                // Progress güncelle
                setProgress(Math.round(((i + 1) / total) * 100));
            }

            // Sonuç
            setCopyResult({
                success: true,
                copiedCount,
                errorCount,
                totalCount: filteredMenus.length,
                message:
                    errorCount === 0
                        ? `${copiedCount} menü öğesi başarıyla kopyalandı!`
                        : `${copiedCount} öğe kopyalandı, ${errorCount} öğede hata oluştu.`,
            });

            if (copiedCount > 0 && onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Kopyalama işlemi hatası:', error);
            setCopyResult({
                success: false,
                message: error?.message || 'Kopyalama işlemi sırasında bir hata oluştu.',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Modal kapatma
     */
    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    /**
     * Formu sıfırla
     */
    const handleReset = () => {
        form.resetFields();
        setProgress(0);
        setCopyResult(null);
        setSourceMenuCount(0);
    };

    return (
        <Modal
            title={
                <Space>
                    <CopyOutlined />
                    <span>Aylık Menü Kopyalama</span>
                </Space>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={600}
            destroyOnClose
            maskClosable={!loading}
            closable={!loading}
        >
            {/* Sonuç Gösterimi */}
            {copyResult ? (
                <Result
                    status={copyResult.success ? 'success' : 'error'}
                    title={copyResult.success ? 'Kopyalama Tamamlandı' : 'Kopyalama Başarısız'}
                    subTitle={copyResult.message}
                    extra={
                        <Space>
                            {copyResult.success && copyResult.copiedCount > 0 && (
                                <Row gutter={16} style={{ marginBottom: 16 }}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Toplam"
                                            value={copyResult.totalCount}
                                            prefix={<CalendarOutlined />}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Başarılı"
                                            value={copyResult.copiedCount}
                                            valueStyle={{ color: '#3f8600' }}
                                            prefix={<CheckCircleOutlined />}
                                        />
                                    </Col>
                                    {copyResult.errorCount > 0 && (
                                        <Col span={8}>
                                            <Statistic
                                                title="Hatalı"
                                                value={copyResult.errorCount}
                                                valueStyle={{ color: '#cf1322' }}
                                                prefix={<WarningOutlined />}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            )}
                            <Button onClick={handleReset}>Yeni Kopyalama</Button>
                            <Button type="primary" onClick={handleClose}>
                                Kapat
                            </Button>
                        </Space>
                    }
                />
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCopy}
                    initialValues={{
                        includeLunch: true,
                        includeDinner: true,
                        overwriteExisting: false,
                    }}
                >
                    {/* Bilgi Kartı */}
                    <Alert
                        message="Menü Kopyalama"
                        description="Bu işlem seçilen kaynak ayın tüm menülerini hedef aya kopyalar. Tarihler otomatik olarak hedef aya göre ayarlanır."
                        type="info"
                        showIcon
                        className="mb-4"
                    />

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="sourceMonth"
                                label="📅 Kaynak Ay"
                                rules={[{ required: true, message: 'Kaynak ay seçin' }]}
                            >
                                <DatePicker
                                    picker="month"
                                    style={{ width: '100%' }}
                                    placeholder="Kaynak ay seçin"
                                    format="MMMM YYYY"
                                    onChange={handleSourceMonthChange}
                                    disabled={loading}
                                />
                            </Form.Item>
                            {sourceMenuCount > 0 && (
                                <Text type="success">
                                    <CheckCircleOutlined /> {sourceMenuCount} menü bulundu
                                </Text>
                            )}
                            {checkingSource && (
                                <Text type="secondary">
                                    <LoadingOutlined /> Kontrol ediliyor...
                                </Text>
                            )}
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="targetMonth"
                                label="🎯 Hedef Ay"
                                rules={[{ required: true, message: 'Hedef ay seçin' }]}
                            >
                                <DatePicker
                                    picker="month"
                                    style={{ width: '100%' }}
                                    placeholder="Hedef ay seçin"
                                    format="MMMM YYYY"
                                    disabled={loading}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Kopyalama Seçenekleri</Divider>

                    <Card size="small" className="mb-4">
                        <Space direction="vertical">
                            <Form.Item name="includeLunch" valuePropName="checked" noStyle>
                                <Checkbox disabled={loading}>
                                    🌞 Öğle Yemeklerini Dahil Et
                                </Checkbox>
                            </Form.Item>
                            <Form.Item name="includeDinner" valuePropName="checked" noStyle>
                                <Checkbox disabled={loading}>
                                    🌙 Akşam Yemeklerini Dahil Et
                                </Checkbox>
                            </Form.Item>
                            <Form.Item name="overwriteExisting" valuePropName="checked" noStyle>
                                <Checkbox disabled={loading}>
                                    ⚠️ Mevcut Menülerin Üzerine Yaz (Onay sorulmaz)
                                </Checkbox>
                            </Form.Item>
                        </Space>
                    </Card>

                    {/* Progress Bar */}
                    {loading && (
                        <div className="mb-4">
                            <Text>Kopyalama işlemi devam ediyor...</Text>
                            <Progress percent={progress} status="active" />
                        </div>
                    )}

                    <Divider />

                    <Row justify="end" gutter={8}>
                        <Col>
                            <Button onClick={handleReset} disabled={loading}>
                                🔄 Sıfırla
                            </Button>
                        </Col>
                        <Col>
                            <Button onClick={handleClose} disabled={loading}>
                                ❌ İptal
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<CopyOutlined />}
                                disabled={sourceMenuCount === 0 && !checkingSource}
                            >
                                {loading ? 'Kopyalanıyor...' : 'Kopyala'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            )}
        </Modal>
    );
};

export default MenuCopyModule;