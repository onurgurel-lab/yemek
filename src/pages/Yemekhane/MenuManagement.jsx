import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, Tag, Alert, Popconfirm, message, Typography, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
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
    selectSubmitting
} from '@/store/slices/yemekhaneSlice';
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
    const { canManageMenu } = useUserRoles();

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

    // Check permissions - useUserRoles hook'undan alınan canManageMenu kullanılıyor
    const hasPermission = canManageMenu;

    // Initialize
    useEffect(() => {
        const today = dayjs().add(1, 'day').format('YYYY-MM-DD'); // Default: yarın
        dispatch(setSelectedDate(today));
        dispatch(fetchMenuByDate(today));
    }, [dispatch]);

    // Filter menu by meal time
    const filteredMenu = React.useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        return menuData.filter(item => item.mealTime === selectedMealTime);
    }, [menuData, selectedMealTime]);

    // Check if editing is allowed (only future dates)
    const isEditingAllowed = useCallback(() => {
        if (!selectedDate) return false;
        const today = dayjs().startOf('day');
        const selected = dayjs(selectedDate).startOf('day');
        return selected.isAfter(today) || selected.isSame(today);
    }, [selectedDate]);

    // Disabled dates (past dates)
    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    // Handle date change
    const handleDateChange = (date) => {
        if (date) {
            const dateStr = date.format('YYYY-MM-DD');
            dispatch(setSelectedDate(dateStr));
            dispatch(fetchMenuByDate(dateStr));
            setSelectedRows([]);
        }
    };

    // Handle meal time change
    const handleMealTimeChange = (mealTime) => {
        setSelectedMealTime(mealTime);
        setSelectedRows([]);
    };

    // Open add modal
    const openAddModal = () => {
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({
            menuDate: dayjs(selectedDate),
            mealTime: selectedMealTime
        });
        setModalVisible(true);
    };

    // Open edit modal
    const openEditModal = (record) => {
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
            const menuData = {
                ...values,
                menuDate: values.menuDate.format('YYYY-MM-DD')
            };

            if (editingItem) {
                await dispatch(updateMenuItem({ id: editingItem.id, ...menuData })).unwrap();
                message.success('Menü öğesi güncellendi');
            } else {
                await dispatch(createMenuItem(menuData)).unwrap();
                message.success('Menü öğesi eklendi');
            }

            setModalVisible(false);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            message.error(error?.message || 'İşlem başarısız');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await dispatch(deleteMenuItem(id)).unwrap();
            message.success('Menü öğesi silindi');
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            message.error(error?.message || 'Silme işlemi başarısız');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        try {
            for (const item of selectedRows) {
                await dispatch(deleteMenuItem(item.id)).unwrap();
            }
            message.success(`${selectedRows.length} öğe silindi`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            message.error('Toplu silme işlemi başarısız');
        }
    };

    // Handle bulk edit
    const handleBulkEdit = async (field, value) => {
        try {
            for (const item of selectedRows) {
                await dispatch(updateMenuItem({
                    id: item.id,
                    ...item,
                    [field]: value
                })).unwrap();
            }
            message.success(`${selectedRows.length} öğe güncellendi`);
            setSelectedRows([]);
            dispatch(fetchMenuByDate(selectedDate));
        } catch (error) {
            message.error('Toplu güncelleme işlemi başarısız');
        }
    };

    // Row selection
    const rowSelection = {
        selectedRowKeys: selectedRows.map(r => r.id),
        onChange: (_, rows) => setSelectedRows(rows),
    };

    // Table columns
    const columns = [
        {
            title: 'Yemek Adı',
            dataIndex: 'foodName',
            key: 'foodName',
            sorter: (a, b) => a.foodName.localeCompare(b.foodName),
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            render: (category) => (
                <Tag color={getCategoryColor(category)}>{category}</Tag>
            ),
            filters: MEAL_CATEGORIES.map(cat => ({ text: cat.label, value: cat.label })),
            onFilter: (value, record) => record.category === value,
        },
        {
            title: 'Kalori',
            dataIndex: 'calorie',
            key: 'calorie',
            render: (cal) => cal ? `${cal} kcal` : '-',
            sorter: (a, b) => (a.calorie || 0) - (b.calorie || 0),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        disabled={!isEditingAllowed()}
                    />
                    <Popconfirm
                        title="Silmek istediğinize emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                        disabled={!isEditingAllowed()}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={!isEditingAllowed()}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
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
        <div className="menu-management">
            <Card
                title={
                    <Space>
                        <Title level={4} style={{ margin: 0 }}>Menü Yönetimi</Title>
                        <Button
                            icon={<CopyOutlined />}
                            onClick={() => setShowCopyModule(true)}
                        >
                            Menü Kopyala
                        </Button>
                    </Space>
                }
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => dispatch(fetchMenuByDate(selectedDate))}
                        loading={loading}
                    >
                        Yenile
                    </Button>
                }
            >
                {/* Filters */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Text strong>Tarih:</Text>
                        <DatePicker
                            value={selectedDate ? dayjs(selectedDate) : null}
                            onChange={handleDateChange}
                            format="DD MMMM YYYY"
                            style={{ width: '100%', marginTop: 4 }}
                            disabledDate={disabledDate}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Text strong>Öğün:</Text>
                        <Select
                            value={selectedMealTime}
                            onChange={handleMealTimeChange}
                            style={{ width: '100%', marginTop: 4 }}
                            options={[
                                { value: MEAL_TIMES.LUNCH, label: MEAL_TIME_LABELS[MEAL_TIMES.LUNCH] },
                                { value: MEAL_TIMES.DINNER, label: MEAL_TIME_LABELS[MEAL_TIMES.DINNER] }
                            ]}
                        />
                    </Col>
                </Row>

                {/* Warning for past dates */}
                {!isEditingAllowed() && (
                    <Alert
                        message="Geçmiş tarihlerde düzenleme yapılamaz. Lütfen ileri bir tarih seçin."
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