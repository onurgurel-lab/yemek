/**
 * BulkActions.jsx - Toplu İşlemler Komponenti
 *
 * Seçili menü öğeleri üzerinde toplu işlemler yapmayı sağlar
 *
 * @module pages/Yemekhane/components/BulkActions
 */

import React, { useState } from 'react';
import {
    Card,
    Space,
    Button,
    Popconfirm,
    Typography,
    Tag,
    Dropdown,
    Modal,
    Select,
    DatePicker,
    Form,
    message,
    Tooltip,
} from 'antd';
import {
    DeleteOutlined,
    CopyOutlined,
    EditOutlined,
    DownOutlined,
    CloseOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { MEAL_TIMES, MEAL_CATEGORIES } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text } = Typography;
const { Option } = Select;

/**
 * Kategori listesi
 */
const CATEGORIES = ['ÇORBA', 'ANA YEMEK', 'SPESYEL SALATA', 'YARDIMCI YEMEK', 'CORNER'];

/**
 * BulkActions Component
 *
 * @param {Object} props
 * @param {Array} props.selectedItems - Seçili öğeler (ID listesi veya obje listesi)
 * @param {Array} props.menuData - Tüm menü verisi (seçili öğeleri bulmak için)
 * @param {Function} props.onDelete - Toplu silme callback'i
 * @param {Function} props.onCopy - Toplu kopyalama callback'i
 * @param {Function} props.onCategoryChange - Kategori değiştirme callback'i
 * @param {Function} props.onMealTimeChange - Öğün değiştirme callback'i
 * @param {Function} props.onClear - Seçimi temizleme callback'i
 * @param {boolean} props.loading - Yükleme durumu
 * @param {string} props.selectedDate - Seçili tarih
 */
const BulkActions = ({
                         selectedItems = [],
                         menuData = [],
                         onDelete,
                         onCopy,
                         onCategoryChange,
                         onMealTimeChange,
                         onClear,
                         loading = false,
                         selectedDate,
                     }) => {
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [mealTimeModalVisible, setMealTimeModalVisible] = useState(false);
    const [copyForm] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [mealTimeForm] = Form.useForm();

    /**
     * Seçili öğe sayısı
     */
    const selectedCount = selectedItems.length;

    /**
     * Seçili öğeler (detaylı)
     */
    const selectedMenuItems = menuData.filter((item) =>
        selectedItems.includes(item.id)
    );

    /**
     * Toplu silme işlemi
     */
    const handleBulkDelete = () => {
        if (onDelete) {
            onDelete(selectedItems);
        }
    };

    /**
     * Toplu kopyalama modalını aç
     */
    const handleOpenCopyModal = () => {
        copyForm.resetFields();
        copyForm.setFieldsValue({
            targetDate: dayjs(selectedDate).add(1, 'day'),
            targetMealTime: null, // Mevcut öğünleri koru
        });
        setCopyModalVisible(true);
    };

    /**
     * Toplu kopyalama işlemi
     */
    const handleBulkCopy = async (values) => {
        if (onCopy) {
            await onCopy(selectedItems, {
                targetDate: values.targetDate.format('YYYY-MM-DD'),
                targetMealTime: values.targetMealTime,
            });
        }
        setCopyModalVisible(false);
    };

    /**
     * Kategori değiştirme işlemi
     */
    const handleCategoryChange = async (values) => {
        if (onCategoryChange) {
            await onCategoryChange(selectedItems, values.category);
        }
        setCategoryModalVisible(false);
    };

    /**
     * Öğün değiştirme işlemi
     */
    const handleMealTimeChange = async (values) => {
        if (onMealTimeChange) {
            await onMealTimeChange(selectedItems, values.mealTime);
        }
        setMealTimeModalVisible(false);
    };

    /**
     * Dropdown menü öğeleri
     */
    const moreActionsMenu = {
        items: [
            {
                key: 'copy',
                icon: <CopyOutlined />,
                label: 'Başka Tarihe Kopyala',
                onClick: handleOpenCopyModal,
            },
            {
                key: 'category',
                icon: <EditOutlined />,
                label: 'Kategori Değiştir',
                onClick: () => setCategoryModalVisible(true),
                disabled: !onCategoryChange,
            },
            {
                key: 'mealtime',
                icon: <SwapOutlined />,
                label: 'Öğün Değiştir',
                onClick: () => setMealTimeModalVisible(true),
                disabled: !onMealTimeChange,
            },
        ],
    };

    // Seçim yoksa gösterme
    if (selectedCount === 0) {
        return null;
    }

    return (
        <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap align="center">
                    {/* Seçim Bilgisi */}
                    <Tag color="blue">
                        {selectedCount} öğe seçildi
                    </Tag>

                    {/* Toplu Sil */}
                    <Popconfirm
                        title={`${selectedCount} öğeyi silmek istediğinizden emin misiniz?`}
                        description="Bu işlem geri alınamaz."
                        onConfirm={handleBulkDelete}
                        okText="Evet, Sil"
                        cancelText="İptal"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={loading}
                            size="small"
                        >
                            Seçilenleri Sil
                        </Button>
                    </Popconfirm>

                    {/* Kopyala */}
                    {onCopy && (
                        <Tooltip title="Seçili öğeleri başka tarihe kopyala">
                            <Button
                                icon={<CopyOutlined />}
                                onClick={handleOpenCopyModal}
                                loading={loading}
                                size="small"
                            >
                                Kopyala
                            </Button>
                        </Tooltip>
                    )}

                    {/* Diğer İşlemler */}
                    {(onCategoryChange || onMealTimeChange) && (
                        <Dropdown menu={moreActionsMenu}>
                            <Button size="small">
                                Diğer İşlemler <DownOutlined />
                            </Button>
                        </Dropdown>
                    )}

                    {/* Seçimi Temizle */}
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onClear}
                        size="small"
                        type="text"
                    >
                        Seçimi Temizle
                    </Button>
                </Space>
            </Card>

            {/* Kopyalama Modal */}
            <Modal
                title="Seçili Öğeleri Kopyala"
                open={copyModalVisible}
                onCancel={() => setCopyModalVisible(false)}
                footer={null}
                width={400}
            >
                <Form
                    form={copyForm}
                    layout="vertical"
                    onFinish={handleBulkCopy}
                >
                    <Form.Item
                        name="targetDate"
                        label="Hedef Tarih"
                        rules={[{ required: true, message: 'Tarih seçin' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="DD MMMM YYYY"
                            disabledDate={(current) =>
                                current && current < dayjs().startOf('day')
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="targetMealTime"
                        label="Hedef Öğün (Opsiyonel)"
                        tooltip="Boş bırakırsanız mevcut öğünler korunur"
                    >
                        <Select allowClear placeholder="Mevcut öğünleri koru">
                            <Option value={MEAL_TIMES.LUNCH}>🌞 Öğle Yemeği</Option>
                            <Option value={MEAL_TIMES.DINNER}>🌙 Akşam Yemeği</Option>
                        </Select>
                    </Form.Item>

                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setCopyModalVisible(false)}>İptal</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Kopyala
                        </Button>
                    </Space>
                </Form>
            </Modal>

            {/* Kategori Değiştirme Modal */}
            <Modal
                title="Kategori Değiştir"
                open={categoryModalVisible}
                onCancel={() => setCategoryModalVisible(false)}
                footer={null}
                width={400}
            >
                <Form
                    form={categoryForm}
                    layout="vertical"
                    onFinish={handleCategoryChange}
                >
                    <Form.Item
                        name="category"
                        label="Yeni Kategori"
                        rules={[{ required: true, message: 'Kategori seçin' }]}
                    >
                        <Select placeholder="Kategori seçin">
                            {CATEGORIES.map((cat) => (
                                <Option key={cat} value={cat}>
                                    {cat}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Text type="secondary">
                        {selectedCount} öğenin kategorisi değiştirilecek.
                    </Text>

                    <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
                        <Button onClick={() => setCategoryModalVisible(false)}>İptal</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Değiştir
                        </Button>
                    </Space>
                </Form>
            </Modal>

            {/* Öğün Değiştirme Modal */}
            <Modal
                title="Öğün Değiştir"
                open={mealTimeModalVisible}
                onCancel={() => setMealTimeModalVisible(false)}
                footer={null}
                width={400}
            >
                <Form
                    form={mealTimeForm}
                    layout="vertical"
                    onFinish={handleMealTimeChange}
                >
                    <Form.Item
                        name="mealTime"
                        label="Yeni Öğün"
                        rules={[{ required: true, message: 'Öğün seçin' }]}
                    >
                        <Select placeholder="Öğün seçin">
                            <Option value={MEAL_TIMES.LUNCH}>🌞 Öğle Yemeği</Option>
                            <Option value={MEAL_TIMES.DINNER}>🌙 Akşam Yemeği</Option>
                        </Select>
                    </Form.Item>

                    <Text type="secondary">
                        {selectedCount} öğenin öğünü değiştirilecek.
                    </Text>

                    <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
                        <Button onClick={() => setMealTimeModalVisible(false)}>İptal</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Değiştir
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </>
    );
};

export default BulkActions;