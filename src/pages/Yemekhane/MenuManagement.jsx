import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, Tag, Alert, Popconfirm, message, Typography, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import {
    fetchMenuByDate,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    setSelectedDate,
    selectMenuData,
    selectSelectedDate,
    selectLoading,
    selectSubmitting
} from '@/store/slices/yemekhaneSlice';
import { canManageMenu } from '@/constants/yemekhaneRoutes';
import { MEAL_TIMES, MEAL_TIME_LABELS, MEAL_CATEGORIES, getCategoryColor } from '@/constants/mealMenuApi';
import MenuCopyModule from './components/MenuCopyModule';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Title, Text } = Typography;

const MenuManagement = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();

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
    const [form] = Form.useForm();

    // Check permissions
    const hasPermission = canManageMenu(user);

    // Initialize
    useEffect(() => {
        const today = dayjs().add(1, 'day').format('YYYY-MM-DD');
        dispatch(setSelectedDate(today));
        dispatch(fetchMenuByDate(today));
    }, [dispatch]);

    // Check if editing is allowed (only future dates)
    const isEditingAllowed = useCallback(() => {
        if (!selectedDate) return false;
        const selected = dayjs(selectedDate);
        const today = dayjs().startOf('day');
        return selected.isAfter(today);
    }, [selectedDate]);

    // Filter menu by meal time
    const filteredMenu = menuData.filter(item => item.mealTime === selectedMealTime);

    // Handle date change
    const handleDateChange = (date) => {
        if (date) {
            const dateStr = date.format('YYYY-MM-DD');
            dispatch(setSelectedDate(dateStr));
            dispatch(fetchMenuByDate(dateStr));
        }
    };

    // Disable past dates
    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    // Open add modal
    const openAddModal = () => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({
            menuDate: dayjs(selectedDate),
            mealTime: selectedMealTime
        });
        setModalVisible(true);
    };

    // Start edit
    const startEdit = (record) => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }
        setEditingItem(record);
        form.setFieldsValue({
            foodName: record.foodName,
            category: record.category,
            calorie: record.calorie,
            menuDate: dayjs(record.menuDate),
            mealTime: record.mealTime
        });
        setModalVisible(true);
    };

    // Handle form submit
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const menuItemData = {
                foodName: values.foodName,
                category: values.category,
                calorie: values.calorie || 0,
                menuDate: values.menuDate.format('YYYY-MM-DD'),
                mealTime: values.mealTime
            };

            if (editingItem) {
                await dispatch(updateMenuItem({ id: editingItem.id, ...menuItemData })).unwrap();
                message.success('Menü öğesi güncellendi');
            } else {
                await dispatch(createMenuItem(menuItemData)).unwrap();
                message.success('Menü öğesi eklendi');
            }

            setModalVisible(false);
            form.resetFields();
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            message.error('İşlem başarısız');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }

        try {
            await dispatch(deleteMenuItem(id)).unwrap();
            message.success('Menü öğesi silindi');
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Silme hatası:', error);
            message.error('Silme işlemi başarısız');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (!isEditingAllowed() || selectedRows.length === 0) return;

        try {
            for (const item of selectedRows) {
                await dispatch(deleteMenuItem(item.id)).unwrap();
            }
            message.success(`${selectedRows.length} öğe silindi`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Toplu silme hatası:', error);
            message.error('Toplu silme işlemi başarısız');
        }
    };

    // Row selection config
    const rowSelection = {
        selectedRowKeys: selectedRows.map(r => r.id),
        onChange: (_, rows) => setSelectedRows(rows)
    };

    // Table columns
    const columns = [
        {
            title: 'Yemek Adı',
            dataIndex: 'foodName',
            key: 'foodName',
            sorter: (a, b) => a.foodName.localeCompare(b.foodName)
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            render: (category) => (
                <Tag color={getCategoryColor(category)}>{category}</Tag>
            ),
            filters: MEAL_CATEGORIES.map(c => ({ text: c.label, value: c.value })),
            onFilter: (value, record) => record.category === value
        },
        {
            title: 'Kalori',
            dataIndex: 'calorie',
            key: 'calorie',
            render: (calorie) => calorie ? `${calorie} kcal` : '-',
            sorter: (a, b) => (a.calorie || 0) - (b.calorie || 0)
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => startEdit(record)}
                        disabled={!isEditingAllowed()}
                    />
                    <Popconfirm
                        title="Bu öğeyi silmek istediğinize emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                        disabled={!isEditingAllowed()}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            disabled={!isEditingAllowed()}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

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
            <Card
                title={
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={4} style={{ margin: 0 }}>Menü Yönetimi</Title>
                        </Col>
                        <Col>
                            <Space>
                                <DatePicker
                                    value={dayjs(selectedDate)}
                                    onChange={handleDateChange}
                                    format="DD MMMM YYYY"
                                    disabledDate={disabledDate}
                                    allowClear={false}
                                />
                                <Select
                                    value={selectedMealTime}
                                    onChange={setSelectedMealTime}
                                    style={{ width: 120 }}
                                    options={[
                                        { value: MEAL_TIMES.LUNCH, label: MEAL_TIME_LABELS[MEAL_TIMES.LUNCH] },
                                        { value: MEAL_TIMES.DINNER, label: MEAL_TIME_LABELS[MEAL_TIMES.DINNER] }
                                    ]}
                                />
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => dispatch(fetchMenuByDate(selectedDate))}
                                >
                                    Yenile
                                </Button>
                                <Button
                                    icon={<CopyOutlined />}
                                    onClick={() => setShowCopyModule(true)}
                                >
                                    Menü Kopyala
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                }
            >
                {/* Warning for non-editable dates */}
                {!isEditingAllowed() && (
                    <Alert
                        message="Bu tarih için düzenleme yapılamaz. Lütfen ileri bir tarih seçin."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Space>
                            <Text>{selectedRows.length} öğe seçildi</Text>
                            <Popconfirm
                                title={`${selectedRows.length} öğeyi silmek istediğinize emin misiniz?`}
                                onConfirm={handleBulkDelete}
                                okText="Evet"
                                cancelText="Hayır"
                            >
                                <Button danger icon={<DeleteOutlined />} disabled={!isEditingAllowed()}>
                                    Seçilenleri Sil
                                </Button>
                            </Popconfirm>
                            <Button onClick={() => setSelectedRows([])}>
                                Seçimi Temizle
                            </Button>
                        </Space>
                    </div>
                )}

                {/* Add Button */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddModal}
                    style={{ marginBottom: 16 }}
                    disabled={!isEditingAllowed()}
                >
                    Yeni Menü Öğesi Ekle
                </Button>

                {/* Table */}
                <Table
                    rowKey="id"
                    dataSource={filteredMenu}
                    columns={columns}
                    loading={loading}
                    rowSelection={rowSelection}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Bu tarih ve öğün için menü bulunamadı' }}
                />
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={editingItem ? 'Menü Öğesini Düzenle' : 'Yeni Menü Öğesi'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                okText={editingItem ? 'Güncelle' : 'Ekle'}
                cancelText="İptal"
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="foodName"
                        label="Yemek Adı"
                        rules={[{ required: true, message: 'Yemek adı gerekli' }]}
                    >
                        <Input placeholder="Örn: Mercimek Çorbası" />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Kategori"
                        rules={[{ required: true, message: 'Kategori seçin' }]}
                    >
                        <Select
                            placeholder="Kategori seçin"
                            options={MEAL_CATEGORIES.map(cat => ({
                                value: cat.value,
                                label: (
                                    <Space>
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </Space>
                                )
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="calorie"
                        label="Kalori (kcal)"
                    >
                        <InputNumber
                            min={0}
                            max={5000}
                            placeholder="Kalori değeri"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="menuDate"
                        label="Tarih"
                        rules={[{ required: true, message: 'Tarih seçin' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            disabledDate={disabledDate}
                            format="DD MMMM YYYY"
                        />
                    </Form.Item>

                    <Form.Item
                        name="mealTime"
                        label="Öğün"
                        rules={[{ required: true, message: 'Öğün seçin' }]}
                    >
                        <Select
                            options={[
                                { value: MEAL_TIMES.LUNCH, label: MEAL_TIME_LABELS[MEAL_TIMES.LUNCH] },
                                { value: MEAL_TIMES.DINNER, label: MEAL_TIME_LABELS[MEAL_TIMES.DINNER] }
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Menu Copy Module */}
            <MenuCopyModule
                visible={showCopyModule}
                onClose={() => setShowCopyModule(false)}
                onCopyComplete={() => dispatch(fetchMenuByDate(selectedDate))}
            />
        </div>
    );
};

export default MenuManagement;