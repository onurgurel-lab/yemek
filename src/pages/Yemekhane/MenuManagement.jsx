/**
 * MenuManagement.jsx - Menü Yönetimi Sayfası
 *
 * Eski projedeki MenuManagement'ın Ant Design + Redux uyarlaması
 * Tarih/öğün seçimi, menü CRUD işlemleri, Excel ve kopyalama modülleri
 *
 * @module pages/Yemekhane/MenuManagement
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Space,
    Tag,
    Alert,
    Popconfirm,
    message,
    Typography,
    Row,
    Col,
    Segmented,
    Tooltip,
    Empty,
    Spin,
    Divider,
    Statistic,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CopyOutlined,
    ReloadOutlined,
    CalendarOutlined,
    FireOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
    fetchMenuByDate,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    setSelectedDate,
    selectMenuData,
    selectSelectedDate,
    selectLoading,
    selectSubmitting,
} from '@/store/slices/yemekhaneSlice';
import {
    MEAL_TIMES,
    MEAL_TIME_LABELS,
    MEAL_CATEGORIES,
    getCategoryColor,
    getCategoryIcon,
} from '@/constants/mealMenuApi';
import MenuCopyModule from './components/MenuCopyModule';
import ExcelModule from './components/ExcelModule';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * Kategori listesi
 */
const CATEGORIES = [
    { value: 'ÇORBA', label: 'Çorba', icon: '🍲', color: '#3498db' },
    { value: 'ANA YEMEK', label: 'Ana Yemek', icon: '🍖', color: '#e74c3c' },
    { value: 'SPESYEL SALATA', label: 'Spesyel Salata', icon: '🥗', color: '#27ae60' },
    { value: 'YARDIMCI YEMEK', label: 'Yardımcı Yemek', icon: '🍛', color: '#f39c12' },
    { value: 'CORNER', label: 'Corner', icon: '🍕', color: '#9b59b6' },
];

/**
 * MenuManagement Component
 */
const MenuManagement = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { canManageMenu, isAdmin, isYemekhaneAdmin } = useUserRoles();

    // Redux state
    const menuData = useSelector(selectMenuData);
    const selectedDate = useSelector(selectSelectedDate);
    const loading = useSelector(selectLoading);
    const submitting = useSelector(selectSubmitting);

    // Local state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedMealTime, setSelectedMealTime] = useState(MEAL_TIMES.LUNCH);
    const [selectedRows, setSelectedRows] = useState([]);
    const [showCopyModule, setShowCopyModule] = useState(false);
    const [showExcelModule, setShowExcelModule] = useState(false);
    const [form] = Form.useForm();

    // Permission check
    const hasPermission = canManageMenu;

    /**
     * Initialize - varsayılan tarih yarın
     */
    useEffect(() => {
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        dispatch(setSelectedDate(tomorrow));
        dispatch(fetchMenuByDate(tomorrow));
    }, [dispatch]);

    /**
     * Seçili öğüne göre menü filtreleme
     */
    const filteredMenu = useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        return menuData.filter((item) => item.mealTime === selectedMealTime);
    }, [menuData, selectedMealTime]);

    /**
     * Düzenleme izni kontrolü - sadece gelecek tarihler
     */
    const isEditingAllowed = useCallback(() => {
        if (!selectedDate) return false;
        const today = dayjs().startOf('day');
        const selected = dayjs(selectedDate).startOf('day');
        return selected.isAfter(today);
    }, [selectedDate]);

    /**
     * Geçmiş tarihler için DatePicker disable
     */
    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    /**
     * Tarih değişikliği
     */
    const handleDateChange = (date) => {
        if (date) {
            const dateStr = date.format('YYYY-MM-DD');
            dispatch(setSelectedDate(dateStr));
            dispatch(fetchMenuByDate(dateStr));
            setSelectedRows([]);
        }
    };

    /**
     * Öğün değişikliği
     */
    const handleMealTimeChange = (mealTime) => {
        setSelectedMealTime(mealTime);
        setSelectedRows([]);
    };

    /**
     * Yeni menü ekleme modalını aç
     */
    const openAddModal = () => {
        if (!isEditingAllowed()) {
            message.warning('Bugün ve geçmiş tarihler için menü eklenemez. Lütfen gelecek bir tarih seçin.');
            return;
        }
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({
            menuDate: dayjs(selectedDate),
            mealTime: selectedMealTime,
        });
        setModalVisible(true);
    };

    /**
     * Düzenleme modalını aç
     */
    const openEditModal = (record) => {
        if (!isEditingAllowed()) {
            message.warning('Bugün ve geçmiş tarihler için menü düzenlenemez.');
            return;
        }
        setEditingItem(record);
        form.setFieldsValue({
            foodName: record.foodName,
            category: record.category,
            calories: record.calories,
            mealTime: record.mealTime,
            menuDate: dayjs(record.menuDate),
            notes: record.notes,
        });
        setModalVisible(true);
    };

    /**
     * Modal kapatma
     */
    const closeModal = () => {
        setModalVisible(false);
        setEditingItem(null);
        form.resetFields();
    };

    /**
     * Form submit - Ekleme veya Güncelleme
     */
    const handleSubmit = async (values) => {
        try {
            const menuData = {
                foodName: values.foodName,
                category: values.category,
                calories: values.calories || 0,
                mealTime: values.mealTime || selectedMealTime,
                menuDate: values.menuDate
                    ? values.menuDate.format('YYYY-MM-DDTHH:mm:ss')
                    : dayjs(selectedDate).format('YYYY-MM-DDTHH:mm:ss'),
                notes: values.notes || '',
            };

            if (editingItem) {
                // Güncelleme
                await dispatch(
                    updateMenuItem({
                        ...menuData,
                        id: editingItem.id,
                    })
                ).unwrap();
                message.success('Menü öğesi başarıyla güncellendi!');
            } else {
                // Yeni ekleme
                await dispatch(createMenuItem(menuData)).unwrap();
                message.success('Menü öğesi başarıyla eklendi!');
            }

            closeModal();
            // Listeyi yenile
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Menü kaydetme hatası:', error);
            message.error(error?.message || 'Menü kaydedilirken bir hata oluştu.');
        }
    };

    /**
     * Silme işlemi
     */
    const handleDelete = async (id) => {
        if (!isEditingAllowed()) {
            message.warning('Bugün ve geçmiş tarihler için menü silinemez.');
            return;
        }

        try {
            await dispatch(deleteMenuItem(id)).unwrap();
            message.success('Menü öğesi başarıyla silindi!');
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Silme hatası:', error);
            message.error(error?.message || 'Menü silinirken bir hata oluştu.');
        }
    };

    /**
     * Toplu silme
     */
    const handleBulkDelete = async () => {
        if (!isEditingAllowed()) {
            message.warning('Bugün ve geçmiş tarihler için menü silinemez.');
            return;
        }

        try {
            for (const id of selectedRows) {
                await dispatch(deleteMenuItem(id)).unwrap();
            }
            message.success(`${selectedRows.length} menü öğesi başarıyla silindi!`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Toplu silme hatası:', error);
            message.error('Bazı öğeler silinirken hata oluştu.');
        }
    };

    /**
     * Listeyi yenile
     */
    const handleRefresh = () => {
        dispatch(fetchMenuByDate(selectedDate));
        setSelectedRows([]);
        message.info('Liste yenilendi');
    };

    /**
     * Kopyalama tamamlandığında
     */
    const handleCopyComplete = () => {
        setShowCopyModule(false);
        dispatch(fetchMenuByDate(selectedDate));
        message.success('Menü kopyalama işlemi tamamlandı!');
    };

    /**
     * Excel import tamamlandığında
     */
    const handleExcelComplete = () => {
        setShowExcelModule(false);
        dispatch(fetchMenuByDate(selectedDate));
    };

    /**
     * Toplam kalori hesaplama
     */
    const totalCalories = useMemo(() => {
        return filteredMenu.reduce((sum, item) => sum + (item.calories || 0), 0);
    }, [filteredMenu]);

    /**
     * Tablo kolonları
     */
    const columns = [
        {
            title: 'Yemek Adı',
            dataIndex: 'foodName',
            key: 'foodName',
            width: '30%',
            render: (text, record) => (
                <Space>
                    <span style={{ fontSize: 18 }}>
                        {getCategoryIcon(record.category) || '🍽️'}
                    </span>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            width: '20%',
            filters: CATEGORIES.map((cat) => ({ text: cat.label, value: cat.value })),
            onFilter: (value, record) => record.category === value,
            render: (category) => {
                const cat = CATEGORIES.find((c) => c.value === category);
                return (
                    <Tag color={cat?.color || '#95a5a6'}>
                        {cat?.icon} {category}
                    </Tag>
                );
            },
        },
        {
            title: 'Kalori',
            dataIndex: 'calories',
            key: 'calories',
            width: '15%',
            sorter: (a, b) => (a.calories || 0) - (b.calories || 0),
            render: (calories) => (
                <Space>
                    <FireOutlined style={{ color: '#ff7a45' }} />
                    <Text>{calories || 0} kcal</Text>
                </Space>
            ),
        },
        {
            title: 'Öğün',
            dataIndex: 'mealTime',
            key: 'mealTime',
            width: '15%',
            render: (mealTime) => (
                <Tag color={mealTime === MEAL_TIMES.LUNCH ? 'orange' : 'blue'}>
                    {mealTime === MEAL_TIMES.LUNCH ? '🌞 Öğle' : '🌙 Akşam'}
                </Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: '20%',
            render: (_, record) => (
                <Space>
                    <Tooltip title={isEditingAllowed() ? 'Düzenle' : 'Geçmiş tarihler düzenlenemez'}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(record)}
                            disabled={!isEditingAllowed()}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Bu menü öğesini silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet, Sil"
                        cancelText="İptal"
                        okButtonProps={{ danger: true }}
                        disabled={!isEditingAllowed()}
                    >
                        <Tooltip title={isEditingAllowed() ? 'Sil' : 'Geçmiş tarihler silinemez'}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={!isEditingAllowed()}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    /**
     * Tablo row selection
     */
    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (selectedRowKeys) => {
            setSelectedRows(selectedRowKeys);
        },
        getCheckboxProps: () => ({
            disabled: !isEditingAllowed(),
        }),
    };

    // Yetki kontrolü
    if (!hasPermission) {
        return (
            <Card>
                <Alert
                    message="Yetkisiz Erişim"
                    description="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır. Admin veya RaporAdmin yetkisi gereklidir."
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <div className="menu-management">
            {/* Başlık ve Aksiyonlar */}
            <Card className="mb-4">
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={12}>
                        <Title level={4} style={{ margin: 0 }}>
                            <CalendarOutlined className="mr-2" />
                            Menü Yönetimi
                        </Title>
                        <Text type="secondary">
                            Yemek menülerini ekleyin, düzenleyin ve yönetin
                        </Text>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => setShowCopyModule(true)}
                            >
                                Menü Kopyala
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => setShowExcelModule(true)}
                            >
                                Excel İşlemleri
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openAddModal}
                                disabled={!isEditingAllowed()}
                            >
                                Yeni Menü Ekle
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Tarih ve Öğün Seçimi */}
            <Card className="mb-4">
                <Row gutter={[24, 16]} align="middle">
                    <Col xs={24} md={8}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>📅 Tarih Seçimi:</Text>
                            <DatePicker
                                value={selectedDate ? dayjs(selectedDate) : null}
                                onChange={handleDateChange}
                                disabledDate={disabledDate}
                                format="DD MMMM YYYY, dddd"
                                style={{ width: '100%' }}
                                placeholder="Tarih seçin"
                                allowClear={false}
                            />
                        </Space>
                    </Col>
                    <Col xs={24} md={8}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>🍽️ Öğün Seçimi:</Text>
                            <Segmented
                                value={selectedMealTime}
                                onChange={handleMealTimeChange}
                                options={[
                                    {
                                        label: (
                                            <Space>
                                                <span>🌞</span>
                                                <span>Öğle Yemeği</span>
                                            </Space>
                                        ),
                                        value: MEAL_TIMES.LUNCH,
                                    },
                                    {
                                        label: (
                                            <Space>
                                                <span>🌙</span>
                                                <span>Akşam Yemeği</span>
                                            </Space>
                                        ),
                                        value: MEAL_TIMES.DINNER,
                                    },
                                ]}
                                block
                            />
                        </Space>
                    </Col>
                    <Col xs={24} md={8}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="Toplam Yemek"
                                    value={filteredMenu.length}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Toplam Kalori"
                                    value={totalCalories}
                                    suffix="kcal"
                                    prefix={<FireOutlined />}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            {/* Uyarı - Geçmiş Tarih */}
            {!isEditingAllowed() && selectedDate && (
                <Alert
                    message="Geçmiş Tarih Uyarısı"
                    description="Bugün ve geçmiş tarihler için menü ekleme, düzenleme ve silme işlemleri yapılamaz. Sadece gelecek tarihler için işlem yapabilirsiniz."
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    className="mb-4"
                />
            )}

            {/* Toplu İşlemler */}
            {selectedRows.length > 0 && isEditingAllowed() && (
                <Card className="mb-4" size="small">
                    <Space>
                        <Text>{selectedRows.length} öğe seçildi</Text>
                        <Popconfirm
                            title={`${selectedRows.length} öğeyi silmek istediğinizden emin misiniz?`}
                            onConfirm={handleBulkDelete}
                            okText="Evet, Sil"
                            cancelText="İptal"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<DeleteOutlined />}>
                                Seçilenleri Sil
                            </Button>
                        </Popconfirm>
                        <Button onClick={() => setSelectedRows([])}>Seçimi Temizle</Button>
                    </Space>
                </Card>
            )}

            {/* Menü Listesi Tablosu */}
            <Card
                title={
                    <Space>
                        <Text strong>
                            📋 {selectedDate ? dayjs(selectedDate).format('DD MMMM YYYY') : ''} -{' '}
                            {selectedMealTime === MEAL_TIMES.LUNCH ? 'Öğle' : 'Akşam'} Yemeği Menüsü
                        </Text>
                        <Button
                            type="text"
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            size="small"
                        />
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredMenu}
                    rowKey="id"
                    rowSelection={rowSelection}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Toplam ${total} öğe`,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                description="Bu tarih ve öğün için menü bulunamadı"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                {isEditingAllowed() && (
                                    <Button type="primary" onClick={openAddModal}>
                                        İlk Menüyü Ekle
                                    </Button>
                                )}
                            </Empty>
                        ),
                    }}
                />
            </Card>

            {/* Ekleme/Düzenleme Modal */}
            <Modal
                title={editingItem ? '🍽️ Menü Öğesini Düzenle' : '🍽️ Yeni Menü Öğesi Ekle'}
                open={modalVisible}
                onCancel={closeModal}
                footer={null}
                destroyOnClose
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        mealTime: selectedMealTime,
                        menuDate: dayjs(selectedDate),
                    }}
                >
                    <Form.Item
                        name="foodName"
                        label="Yemek Adı"
                        rules={[{ required: true, message: 'Lütfen yemek adını girin' }]}
                    >
                        <Input placeholder="Örn: Mercimek Çorbası" maxLength={100} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Kategori"
                                rules={[{ required: true, message: 'Lütfen kategori seçin' }]}
                            >
                                <Select placeholder="Kategori seçin">
                                    {CATEGORIES.map((cat) => (
                                        <Option key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="calories" label="Kalori (kcal)">
                                <InputNumber
                                    min={0}
                                    max={5000}
                                    style={{ width: '100%' }}
                                    placeholder="Örn: 250"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="menuDate"
                                label="Tarih"
                                rules={[{ required: true, message: 'Lütfen tarih seçin' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    disabledDate={disabledDate}
                                    format="DD MMMM YYYY"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="mealTime"
                                label="Öğün"
                                rules={[{ required: true, message: 'Lütfen öğün seçin' }]}
                            >
                                <Select>
                                    <Option value={MEAL_TIMES.LUNCH}>🌞 Öğle Yemeği</Option>
                                    <Option value={MEAL_TIMES.DINNER}>🌙 Akşam Yemeği</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notlar">
                        <TextArea rows={2} placeholder="Opsiyonel notlar..." maxLength={500} />
                    </Form.Item>

                    <Divider />

                    <Row justify="end" gutter={8}>
                        <Col>
                            <Button onClick={closeModal}>İptal</Button>
                        </Col>
                        <Col>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {editingItem ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Menü Kopyalama Modülü */}
            <MenuCopyModule
                visible={showCopyModule}
                onClose={() => setShowCopyModule(false)}
                onComplete={handleCopyComplete}
            />

            {/* Excel İşlemleri Modülü */}
            <ExcelModule
                visible={showExcelModule}
                onClose={() => setShowExcelModule(false)}
                onComplete={handleExcelComplete}
            />
        </div>
    );
};

export default MenuManagement;