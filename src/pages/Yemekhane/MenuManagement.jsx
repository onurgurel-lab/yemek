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
import { canManageMenu } from '@/routes/yemekhaneRoutes';
import { MEAL_TIMES, MEAL_TIME_LABELS, MEAL_CATEGORIES, getCategoryColor } from '@/constants/mealMenuApi';
import MenuCopyModule from './components/MenuCopyModule';
import BulkActions from './components/BulkActions';
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
        const today = dayjs().add(1, 'day').format('YYYY-MM-DD'); // Default to tomorrow
        dispatch(setSelectedDate(today));
    }, [dispatch]);

    // Load menu when date or meal time changes
    useEffect(() => {
        if (selectedDate) {
            dispatch(fetchMenuByDate(selectedDate));
        }
    }, [selectedDate, dispatch]);

    // Filter menu by selected meal time
    const filteredMenu = menuData.filter(item => item.mealTime === selectedMealTime);

    // Check if editing is allowed (only future dates)
    const isEditingAllowed = useCallback(() => {
        if (!selectedDate) return false;
        const selected = dayjs(selectedDate).startOf('day');
        const today = dayjs().startOf('day');
        return selected.isAfter(today);
    }, [selectedDate]);

    // Handle date change
    const handleDateChange = (date) => {
        if (date) {
            dispatch(setSelectedDate(date.format('YYYY-MM-DD')));
        }
    };

    // Disable past dates
    const disabledDate = (current) => {
        return current && current <= dayjs().startOf('day');
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

    // Open edit modal
    const startEdit = (item) => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }
        setEditingItem(item);
        form.setFieldsValue({
            foodName: item.foodName,
            category: item.category,
            calorie: item.calorie,
            menuDate: dayjs(item.menuDate),
            mealTime: item.mealTime
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
                await dispatch(updateMenuItem({ id: editingItem.id, data: menuItemData })).unwrap();
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
    const handleBulkDelete = async (items) => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }

        try {
            for (const item of items) {
                await dispatch(deleteMenuItem(item.id)).unwrap();
            }
            message.success(`${items.length} öğe silindi`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Toplu silme hatası:', error);
            message.error('Toplu silme işlemi başarısız');
        }
    };

    // Handle bulk edit
    const handleBulkEdit = async (items, changes) => {
        if (!isEditingAllowed()) {
            message.warning('Geçmiş veya bugünün menüsü düzenlenemez');
            return;
        }

        try {
            for (const item of items) {
                const updatedData = { ...item, ...changes };
                await dispatch(updateMenuItem({ id: item.id, data: updatedData })).unwrap();
            }
            message.success(`${items.length} öğe güncellendi`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            console.error('Toplu düzenleme hatası:', error);
            message.error('Toplu düzenleme işlemi başarısız');
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
            filters: MEAL_CATEGORIES.map(c => ({ text: c.label, value: c.label })),
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
                <div style={{ marginBottom: 24 }}>
                    <Title level={3}>Menü Yönetimi</Title>
                    <Text type="secondary">Yemek menüsünü ekleyin, düzenleyin veya silin.</Text>
                </div>

                {/* Filters */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Tarih:</Text>
                        <DatePicker
                            value={selectedDate ? dayjs(selectedDate) : null}
                            onChange={handleDateChange}
                            disabledDate={disabledDate}
                            style={{ width: '100%' }}
                            format="DD MMMM YYYY"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Öğün:</Text>
                        <Select
                            value={selectedMealTime}
                            onChange={setSelectedMealTime}
                            style={{ width: '100%' }}
                            options={[
                                { value: MEAL_TIMES.LUNCH, label: MEAL_TIME_LABELS[MEAL_TIMES.LUNCH] },
                                { value: MEAL_TIMES.DINNER, label: MEAL_TIME_LABELS[MEAL_TIMES.DINNER] }
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Space>
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

                {/* Warning for past dates */}
                {!isEditingAllowed() && (
                    <Alert
                        message="Düzenleme Kısıtlaması"
                        description="Bugün veya geçmiş tarihlerin menüsü düzenlenemez. Lütfen ileri bir tarih seçin."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Bulk Actions */}
                <BulkActions
                    selectedCount={selectedRows.length}
                    selectedItems={selectedRows}
                    onBulkDelete={handleBulkDelete}
                    onBulkEdit={handleBulkEdit}
                    onSelectAll={() => setSelectedRows(filteredMenu)}
                    onDeselectAll={() => setSelectedRows([])}
                    disabled={!isEditingAllowed()}
                    totalCount={filteredMenu.length}
                />

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
                                value: cat.label,
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