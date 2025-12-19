/**
 * MenuList.jsx - Menü Listesi Komponenti
 *
 * Eski projedeki MenuList'in Ant Design uyarlaması
 * Tablo veya kart grid olarak menü öğelerini gösterir
 *
 * @module pages/Yemekhane/components/MenuList
 */

import React, { useMemo, useState } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Tag,
    Space,
    Button,
    Empty,
    Typography,
    Tooltip,
    Popconfirm,
    Badge,
    Segmented,
    Input,
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    FireOutlined,
    SearchOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { MEAL_TIMES } from '@/constants/mealMenuApi';

const { Text, Title } = Typography;
const { Search } = Input;

/**
 * Kategori ikonları ve renkleri
 */
const CATEGORY_CONFIG = {
    'ÇORBA': { icon: '🍲', color: '#3498db' },
    'ANA YEMEK': { icon: '🍖', color: '#e74c3c' },
    'SPESYEL SALATA': { icon: '🥗', color: '#27ae60' },
    'YARDIMCI YEMEK': { icon: '🍛', color: '#f39c12' },
    'CORNER': { icon: '🍕', color: '#9b59b6' },
};

/**
 * Kalori formatı
 */
const formatCalories = (calories) => {
    return calories ? `${calories} kcal` : 'Belirtilmemiş';
};

/**
 * Kategori ikonu al
 */
const getCategoryIcon = (category) => {
    return CATEGORY_CONFIG[category]?.icon || '🍽️';
};

/**
 * Kategori rengi al
 */
const getCategoryColor = (category) => {
    return CATEGORY_CONFIG[category]?.color || '#95a5a6';
};

/**
 * MenuList Component
 *
 * @param {Object} props
 * @param {Array} props.menuItems - Menü öğeleri listesi
 * @param {Function} props.onEdit - Düzenleme callback'i
 * @param {Function} props.onDelete - Silme callback'i
 * @param {boolean} props.isEditingAllowed - Düzenleme izni
 * @param {boolean} props.loading - Yükleme durumu
 * @param {Array} props.selectedRowKeys - Seçili satır key'leri
 * @param {Function} props.onSelectionChange - Seçim değişikliği callback'i
 * @param {string} props.viewMode - Görünüm modu ('table' veya 'grid')
 * @param {Function} props.onViewModeChange - Görünüm modu değişikliği
 * @param {boolean} props.showViewToggle - Görünüm toggle'ı göster
 * @param {boolean} props.showSearch - Arama alanını göster
 */
const MenuList = ({
                      menuItems = [],
                      onEdit,
                      onDelete,
                      isEditingAllowed = true,
                      loading = false,
                      selectedRowKeys = [],
                      onSelectionChange,
                      viewMode = 'table',
                      onViewModeChange,
                      showViewToggle = false,
                      showSearch = false,
                  }) => {
    const [localViewMode, setLocalViewMode] = useState(viewMode);
    const [searchTerm, setSearchTerm] = useState('');

    /**
     * Arama filtresi
     */
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return menuItems;
        const term = searchTerm.toLowerCase().trim();
        return menuItems.filter(
            (item) =>
                item.foodName?.toLowerCase().includes(term) ||
                item.category?.toLowerCase().includes(term)
        );
    }, [menuItems, searchTerm]);

    /**
     * Görünüm modu değişikliği
     */
    const handleViewModeChange = (mode) => {
        setLocalViewMode(mode);
        if (onViewModeChange) {
            onViewModeChange(mode);
        }
    };

    /**
     * Tablo kolonları
     */
    const columns = [
        {
            title: 'Yemek Adı',
            dataIndex: 'foodName',
            key: 'foodName',
            width: '35%',
            sorter: (a, b) => a.foodName.localeCompare(b.foodName),
            render: (text, record) => (
                <Space>
                    <span style={{ fontSize: 18 }}>{getCategoryIcon(record.category)}</span>
                    <div>
                        <Text strong>{text}</Text>
                        {record.isVegetarian && (
                            <Tag color="green" size="small" style={{ marginLeft: 8 }}>
                                🥬 Vejetaryen
                            </Tag>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            width: '20%',
            filters: Object.keys(CATEGORY_CONFIG).map((cat) => ({
                text: cat,
                value: cat,
            })),
            onFilter: (value, record) => record.category === value,
            render: (category) => (
                <Tag color={getCategoryColor(category)}>
                    {getCategoryIcon(category)} {category}
                </Tag>
            ),
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
                    <Text>{formatCalories(calories)}</Text>
                </Space>
            ),
        },
        {
            title: 'Öğün',
            dataIndex: 'mealTime',
            key: 'mealTime',
            width: '12%',
            filters: [
                { text: 'Öğle', value: MEAL_TIMES.LUNCH },
                { text: 'Akşam', value: MEAL_TIMES.DINNER },
            ],
            onFilter: (value, record) => record.mealTime === value,
            render: (mealTime) => (
                <Tag color={mealTime === MEAL_TIMES.LUNCH ? 'orange' : 'blue'}>
                    {mealTime === MEAL_TIMES.LUNCH ? '🌞 Öğle' : '🌙 Akşam'}
                </Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: '18%',
            render: (_, record) => (
                <Space>
                    <Tooltip title={isEditingAllowed ? 'Düzenle' : 'Geçmiş tarihler düzenlenemez'}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => onEdit && onEdit(record)}
                            disabled={!isEditingAllowed}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Bu menü öğesini silmek istediğinizden emin misiniz?"
                        onConfirm={() => onDelete && onDelete(record.id)}
                        okText="Evet, Sil"
                        cancelText="İptal"
                        okButtonProps={{ danger: true }}
                        disabled={!isEditingAllowed}
                    >
                        <Tooltip title={isEditingAllowed ? 'Sil' : 'Geçmiş tarihler silinemez'}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={!isEditingAllowed}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    /**
     * Satır seçimi konfigürasyonu
     */
    const rowSelection = onSelectionChange
        ? {
            selectedRowKeys,
            onChange: onSelectionChange,
            getCheckboxProps: () => ({
                disabled: !isEditingAllowed,
            }),
        }
        : undefined;

    /**
     * Boş liste durumu
     */
    if (!loading && filteredItems.length === 0) {
        return (
            <Card>
                {/* Toolbar */}
                {(showViewToggle || showSearch) && (
                    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                        <Col>
                            <Title level={5} style={{ margin: 0 }}>
                                📋 Menü Öğeleri
                            </Title>
                        </Col>
                    </Row>
                )}

                <Empty
                    description={
                        searchTerm ? (
                            <span>
                                &quot;{searchTerm}&quot; için sonuç bulunamadı
                            </span>
                        ) : (
                            <span>Henüz menü öğesi bulunmuyor</span>
                        )
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    {searchTerm && (
                        <Button onClick={() => setSearchTerm('')}>Aramayı Temizle</Button>
                    )}
                </Empty>
            </Card>
        );
    }

    return (
        <Card>
            {/* Toolbar */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col flex="auto">
                    <Space>
                        <Title level={5} style={{ margin: 0 }}>
                            📋 Menü Öğeleri
                        </Title>
                        <Badge
                            count={filteredItems.length}
                            style={{ backgroundColor: '#52c41a' }}
                        />
                    </Space>
                </Col>

                <Col>
                    <Space>
                        {/* Arama */}
                        {showSearch && (
                            <Search
                                placeholder="Yemek ara..."
                                allowClear
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: 200 }}
                                size="small"
                            />
                        )}

                        {/* Görünüm Toggle */}
                        {showViewToggle && (
                            <Segmented
                                value={localViewMode}
                                onChange={handleViewModeChange}
                                options={[
                                    {
                                        value: 'table',
                                        icon: <UnorderedListOutlined />,
                                    },
                                    {
                                        value: 'grid',
                                        icon: <AppstoreOutlined />,
                                    },
                                ]}
                                size="small"
                            />
                        )}
                    </Space>
                </Col>
            </Row>

            {/* Tablo Görünümü */}
            {localViewMode === 'table' ? (
                <Table
                    columns={columns}
                    dataSource={filteredItems}
                    rowKey="id"
                    rowSelection={rowSelection}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (total) => `Toplam ${total} öğe`,
                    }}
                    size="middle"
                />
            ) : (
                /* Grid (Card) Görünümü */
                <Row gutter={[16, 16]}>
                    {filteredItems.map((item) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                            <Card
                                hoverable
                                size="small"
                                actions={
                                    isEditingAllowed
                                        ? [
                                            <Tooltip title="Düzenle" key="edit">
                                                <EditOutlined
                                                    onClick={() => onEdit && onEdit(item)}
                                                />
                                            </Tooltip>,
                                            <Popconfirm
                                                key="delete"
                                                title="Silmek istediğinizden emin misiniz?"
                                                onConfirm={() => onDelete && onDelete(item.id)}
                                                okText="Evet"
                                                cancelText="Hayır"
                                            >
                                                <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                            </Popconfirm>,
                                        ]
                                        : undefined
                                }
                            >
                                <Card.Meta
                                    avatar={
                                        <span style={{ fontSize: 28 }}>
                                            {getCategoryIcon(item.category)}
                                        </span>
                                    }
                                    title={
                                        <Space direction="vertical" size={0}>
                                            <Text strong ellipsis style={{ maxWidth: 150 }}>
                                                {item.foodName}
                                            </Text>
                                            <Tag
                                                color={getCategoryColor(item.category)}
                                                style={{ marginTop: 4 }}
                                            >
                                                {item.category}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={4}>
                                            <Space>
                                                <FireOutlined style={{ color: '#ff7a45' }} />
                                                <Text type="secondary">
                                                    {formatCalories(item.calories)}
                                                </Text>
                                            </Space>
                                            <Tag
                                                color={
                                                    item.mealTime === MEAL_TIMES.LUNCH
                                                        ? 'orange'
                                                        : 'blue'
                                                }
                                            >
                                                {item.mealTime === MEAL_TIMES.LUNCH
                                                    ? '🌞 Öğle'
                                                    : '🌙 Akşam'}
                                            </Tag>
                                            {item.isVegetarian && (
                                                <Tag color="green" size="small">
                                                    🥬 Vejetaryen
                                                </Tag>
                                            )}
                                        </Space>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Card>
    );
};

export default MenuList;