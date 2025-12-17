import React, { useState } from 'react';
import { Space, Button, Dropdown, Modal, Form, Select, InputNumber, Typography, Popconfirm, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, DownOutlined, ExclamationCircleOutlined, CheckSquareOutlined, CloseSquareOutlined } from '@ant-design/icons';
import { MEAL_CATEGORIES } from '@/constants/mealMenuApi';

const { Text } = Typography;

const BulkActions = ({
                         selectedCount = 0,
                         selectedItems = [],
                         onBulkDelete,
                         onBulkEdit,
                         onSelectAll,
                         onDeselectAll,
                         disabled = false,
                         totalCount = 0
                     }) => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [editLoading, setEditLoading] = useState(false);

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedCount === 0) {
            message.warning('Lütfen silmek için öğe seçin');
            return;
        }

        try {
            await onBulkDelete?.(selectedItems);
        } catch (error) {
            console.error('Toplu silme hatası:', error);
        }
    };

    // Open bulk edit modal
    const openEditModal = () => {
        if (selectedCount === 0) {
            message.warning('Lütfen düzenlemek için öğe seçin');
            return;
        }
        editForm.resetFields();
        setEditModalVisible(true);
    };

    // Handle bulk edit submit
    const handleBulkEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();

            // Filter out undefined values
            const changes = {};
            if (values.category !== undefined) {
                changes.category = values.category;
            }
            if (values.calorie !== undefined && values.calorie !== null) {
                changes.calorie = values.calorie;
            }

            if (Object.keys(changes).length === 0) {
                message.warning('En az bir alan değiştirmelisiniz');
                return;
            }

            setEditLoading(true);
            await onBulkEdit?.(selectedItems, changes);
            setEditModalVisible(false);
        } catch (error) {
            console.error('Toplu düzenleme hatası:', error);
        } finally {
            setEditLoading(false);
        }
    };

    // Cancel edit modal
    const handleCancelEdit = () => {
        editForm.resetFields();
        setEditModalVisible(false);
    };

    // More actions dropdown items
    const moreActionsItems = [
        {
            key: 'selectAll',
            label: 'Tümünü Seç',
            icon: <CheckSquareOutlined />,
            onClick: onSelectAll
        },
        {
            key: 'deselectAll',
            label: 'Seçimi Kaldır',
            icon: <CloseSquareOutlined />,
            onClick: onDeselectAll
        }
    ];

    // If no items selected, show minimal UI
    if (selectedCount === 0) {
        return (
            <div style={{
                padding: '8px 16px',
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text type="secondary">
                    Toplu işlem için öğe seçin
                </Text>
                {totalCount > 0 && (
                    <Button
                        size="small"
                        icon={<CheckSquareOutlined />}
                        onClick={onSelectAll}
                    >
                        Tümünü Seç ({totalCount})
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <div style={{
                padding: '12px 16px',
                background: '#e6f7ff',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #91d5ff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8
            }}>
                <Space>
                    <Tag color="blue" style={{ margin: 0, padding: '4px 12px', fontSize: 14 }}>
                        {selectedCount} öğe seçildi
                    </Tag>
                </Space>

                <Space wrap>
                    <Button
                        icon={<EditOutlined />}
                        onClick={openEditModal}
                        disabled={disabled}
                    >
                        Toplu Düzenle
                    </Button>

                    <Popconfirm
                        title="Toplu Silme"
                        description={`${selectedCount} öğeyi silmek istediğinize emin misiniz?`}
                        onConfirm={handleBulkDelete}
                        okText="Evet, Sil"
                        cancelText="İptal"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={disabled}
                        >
                            Toplu Sil
                        </Button>
                    </Popconfirm>

                    <Dropdown
                        menu={{ items: moreActionsItems }}
                        trigger={['click']}
                    >
                        <Button>
                            Diğer <DownOutlined />
                        </Button>
                    </Dropdown>
                </Space>
            </div>

            {/* Bulk Edit Modal */}
            <Modal
                title={
                    <Space>
                        <EditOutlined />
                        <span>Toplu Düzenleme</span>
                        <Tag color="blue">{selectedCount} öğe</Tag>
                    </Space>
                }
                open={editModalVisible}
                onCancel={handleCancelEdit}
                footer={[
                    <Button key="cancel" onClick={handleCancelEdit}>
                        İptal
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleBulkEditSubmit}
                        loading={editLoading}
                    >
                        Uygula
                    </Button>
                ]}
                destroyOnClose
            >
                <Form
                    form={editForm}
                    layout="vertical"
                >
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Değiştirmek istediğiniz alanları doldurun. Boş bırakılan alanlar değiştirilmeyecektir.
                    </Text>

                    <Form.Item
                        name="category"
                        label="Kategori"
                    >
                        <Select
                            allowClear
                            placeholder="Kategori seçin (değiştirmek için)"
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
                            placeholder="Kalori değeri girin (değiştirmek için)"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    {/* Preview of selected items */}
                    <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#fafafa',
                        borderRadius: 8,
                        maxHeight: 150,
                        overflow: 'auto'
                    }}>
                        <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                            Seçili Öğeler:
                        </Text>
                        {selectedItems.slice(0, 5).map((item, idx) => (
                            <div key={item.id || idx} style={{ marginBottom: 4 }}>
                                <Tag>{item.foodName}</Tag>
                            </div>
                        ))}
                        {selectedItems.length > 5 && (
                            <Text type="secondary">
                                +{selectedItems.length - 5} öğe daha...
                            </Text>
                        )}
                    </div>
                </Form>
            </Modal>
        </>
    );
};

export default BulkActions;