/**
 * Reports.jsx - Yemekhane Raporlama Sayfası
 *
 * Eski projedeki Reports.jsx'in Ant Design uyarlaması
 * Genel bakış, yemek analizi, günlük trendler ve yorum analizi sekmeleri
 *
 * @module pages/Yemekhane/components/Reports
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Tabs,
    Table,
    Statistic,
    Row,
    Col,
    DatePicker,
    Select,
    Input,
    Button,
    Tag,
    Rate,
    Progress,
    Empty,
    Spin,
    Alert,
    Modal,
    List,
    Typography,
    Space,
    Divider,
    Badge,
    Tooltip,
    message,
} from 'antd';
import {
    BarChartOutlined,
    LineChartOutlined,
    CommentOutlined,
    PieChartOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    CalendarOutlined,
    StarOutlined,
    MessageOutlined,
    RiseOutlined,
    FallOutlined,
    DashboardOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useUserRoles } from '@/hooks/useUserRoles';
import * as reportService from '@/services/reportService';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

/**
 * Reports - Yemekhane Raporlama Ana Bileşeni
 */
const Reports = () => {
    // Aktif sekme durumu
    const [activeTab, setActiveTab] = useState('overview');

    // Loading ve hata durumları
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Yetki kontrolü
    const { canManageMenu, isAdmin, isYemekhaneAdmin } = useUserRoles();

    // ==== VERİ STATE'LERİ ====
    const [generalStats, setGeneralStats] = useState(null);
    const [todayAverage, setTodayAverage] = useState(null);
    const [mealsByRating, setMealsByRating] = useState([]);
    const [dailyAverages, setDailyAverages] = useState([]);
    const [todayComments, setTodayComments] = useState([]);
    const [dateRangeComments, setDateRangeComments] = useState([]);

    // ==== FİLTRE STATE'LERİ ====
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [commentsDateRange, setCommentsDateRange] = useState([null, null]);

    // ==== POPUP STATE'LERİ ====
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [mealModalVisible, setMealModalVisible] = useState(false);

    // ==== PAGINATION STATE'LERİ ====
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [dailyCurrentPage, setDailyCurrentPage] = useState(1);
    const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);

    // ==== CHART STATE'LERİ ====
    const [chartPeriod, setChartPeriod] = useState('1week');
    const [showChart, setShowChart] = useState(true);

    // ============================================================
    // YETKİ KONTROLÜ
    // ============================================================

    if (!canManageMenu) {
        return (
            <Card>
                <Alert
                    type="error"
                    showIcon
                    icon={<BarChartOutlined />}
                    message="Erişim Reddedildi"
                    description={
                        <div>
                            <Paragraph>Bu sayfaya erişim yetkiniz bulunmamaktadır.</Paragraph>
                            <Paragraph>
                                Sadece <Tag color="red">Admin</Tag> veya{' '}
                                <Tag color="orange">RaporAdmin</Tag> rolüne sahip kullanıcılar
                                raporları görüntüleyebilir.
                            </Paragraph>
                        </div>
                    }
                />
            </Card>
        );
    }

    // ============================================================
    // VERİ YÜKLEME FONKSİYONLARI
    // ============================================================

    /**
     * Genel bakış verilerini yükle
     */
    const loadOverviewData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [statsRes, todayRes, mealsRes, commentsRes] = await Promise.all([
                reportService.getGeneralStats().catch(() => null),
                reportService.getTodayAverage().catch(() => null),
                reportService.getMealsByRating().catch(() => []),
                reportService.getTodayComments().catch(() => []),
            ]);

            setGeneralStats(statsRes);
            setTodayAverage(todayRes);
            setMealsByRating(mealsRes || []);
            setTodayComments(commentsRes || []);

            // Kategorileri çıkar
            if (mealsRes && Array.isArray(mealsRes)) {
                const uniqueCategories = [...new Set(
                    mealsRes
                        .map(m => m.category)
                        .filter(Boolean)
                        .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
                )].sort();
                setCategories(uniqueCategories);
            }

        } catch (err) {
            console.error('Veri yükleme hatası:', err);
            setError('Veriler yüklenirken bir hata oluştu.');
            message.error('Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Günlük ortalamaları yükle
     */
    const loadDailyAverages = async () => {
        if (!dateRange[0] || !dateRange[1]) {
            message.warning('Lütfen tarih aralığı seçiniz.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');

            const response = await reportService.getDailyAverages(startDate, endDate);
            setDailyAverages(response || []);
            setDailyCurrentPage(1);

            message.success(`${(response || []).length} günlük veri yüklendi.`);
        } catch (err) {
            console.error('Günlük ortalamalar hatası:', err);
            setError('Günlük ortalamalar yüklenirken hata oluştu.');
            message.error('Günlük ortalamalar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Tarih aralığı yorumlarını yükle
     */
    const loadCommentsByDateRange = async () => {
        if (!commentsDateRange[0] || !commentsDateRange[1]) {
            message.warning('Lütfen tarih aralığı seçiniz.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const startDate = commentsDateRange[0].format('YYYY-MM-DD');
            const endDate = commentsDateRange[1].format('YYYY-MM-DD');

            const response = await reportService.getCommentsByDateRange(startDate, endDate);
            setDateRangeComments(response || []);
            setCommentsCurrentPage(1);

            message.success(`${(response || []).length} yorum bulundu.`);
        } catch (err) {
            console.error('Yorumlar yükleme hatası:', err);
            setError('Yorumlar yüklenirken hata oluştu.');
            message.error('Yorumlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // YARDIMCI FONKSİYONLAR
    // ============================================================

    /**
     * Aynı isimli yemekleri birleştir
     */
    const getConsolidatedMeals = useMemo(() => {
        const mealMap = new Map();

        mealsByRating.forEach(meal => {
            const mealName = meal.foodName || meal.name;
            if (!mealName) return;

            if (mealMap.has(mealName)) {
                const existing = mealMap.get(mealName);
                existing.menuPoints = [...(existing.menuPoints || []), ...(meal.menuPoints || [])];
                existing.menuComments = [...(existing.menuComments || []), ...(meal.menuComments || [])];
                existing.totalCalories = (existing.totalCalories || 0) + (meal.calories || 0);
                existing.occurrences = (existing.occurrences || 1) + 1;
                existing.dates = [...(existing.dates || []), meal.menuDate].filter(Boolean);
            } else {
                mealMap.set(mealName, {
                    ...meal,
                    foodName: mealName,
                    menuPoints: meal.menuPoints || [],
                    menuComments: meal.menuComments || [],
                    totalCalories: meal.calories || 0,
                    occurrences: 1,
                    dates: [meal.menuDate].filter(Boolean),
                });
            }
        });

        return Array.from(mealMap.values());
    }, [mealsByRating]);

    /**
     * Filtrelenmiş yemekleri getir
     */
    const filteredMeals = useMemo(() => {
        let meals = getConsolidatedMeals;

        if (searchTerm) {
            meals = meals.filter(m =>
                m.foodName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory) {
            meals = meals.filter(m =>
                m.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        return meals;
    }, [getConsolidatedMeals, searchTerm, selectedCategory]);

    /**
     * Puan formatla
     */
    const formatRating = (rating) => {
        if (typeof rating !== 'number' || isNaN(rating)) return '0.00';
        return rating.toFixed(2);
    };

    /**
     * Tarih formatla
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return dayjs(dateString).format('DD.MM.YYYY');
        } catch {
            return dateString;
        }
    };

    /**
     * Ortalama puan hesapla
     */
    const calculateAverageRating = (menuPoints) => {
        if (!menuPoints || menuPoints.length === 0) return 0;
        const sum = menuPoints.reduce((acc, p) => acc + (p.point || 0), 0);
        return sum / menuPoints.length;
    };

    /**
     * Filtreleri sıfırla
     */
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setCurrentPage(1);
    };

    /**
     * Yemek detay popup aç
     */
    const openMealModal = (meal) => {
        setSelectedMeal(meal);
        setMealModalVisible(true);
    };

    // ============================================================
    // YAŞAM DÖNGÜSÜ
    // ============================================================

    useEffect(() => {
        loadOverviewData();
    }, []);

    // Varsayılan tarih aralığı (son 7 gün)
    useEffect(() => {
        if (!dateRange[0] && !dateRange[1]) {
            setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
        }
        if (!commentsDateRange[0] && !commentsDateRange[1]) {
            setCommentsDateRange([dayjs().subtract(7, 'day'), dayjs()]);
        }
    }, []);

    // ============================================================
    // TAB İÇERİKLERİ
    // ============================================================

    /**
     * Genel Bakış Sekmesi
     */
    const renderOverviewTab = () => (
        <div>
            {/* İstatistik Kartları */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card hoverable>
                        <Statistic
                            title="Genel Ortalama"
                            value={formatRating(generalStats?.averageRating)}
                            prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
                            suffix="/ 5"
                        />
                        <Progress
                            percent={(generalStats?.averageRating || 0) * 20}
                            showInfo={false}
                            strokeColor="#1890ff"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card hoverable>
                        <Statistic
                            title="Toplam Yorum"
                            value={generalStats?.totalComments || 0}
                            prefix={<MessageOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card hoverable>
                        <Statistic
                            title="En Yüksek Puan"
                            value={generalStats?.highestRating || 0}
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                            suffix="/ 5"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card hoverable>
                        <Statistic
                            title="Bugünün Ortalaması"
                            value={formatRating(todayAverage?.todayAverageRating || todayAverage?.average)}
                            prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                            suffix="/ 5"
                        />
                        <Progress
                            percent={((todayAverage?.todayAverageRating || todayAverage?.average || 0) * 20)}
                            showInfo={false}
                            strokeColor="#722ed1"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bugünün Yorumları */}
            <Card
                title={
                    <Space>
                        <CommentOutlined />
                        <span>Bugünün Yorumları</span>
                        <Badge count={todayComments.length} style={{ backgroundColor: '#52c41a' }} />
                    </Space>
                }
            >
                {todayComments.length > 0 ? (
                    <List
                        dataSource={todayComments.slice(0, 5)}
                        renderItem={(comment) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<UserOutlined style={{ fontSize: 24 }} />}
                                    title={
                                        <Space>
                                            <Text strong>{comment.mealMenu?.foodName || 'Bilinmeyen Yemek'}</Text>
                                            <Tag color="blue">{comment.mealMenu?.category}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <ClockCircleOutlined /> {formatDate(comment.createdDate)}
                                            </Text>
                                        </Space>
                                    }
                                    description={comment.comment}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="Bugün henüz yorum yapılmamış." />
                )}
            </Card>
        </div>
    );

    /**
     * Yemek Analizi Sekmesi
     */
    const renderMealsTab = () => {
        // Pagination
        const paginatedMeals = filteredMeals.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
        );

        // Tablo kolonları
        const columns = [
            {
                title: 'Yemek Adı',
                dataIndex: 'foodName',
                key: 'foodName',
                render: (text, record) => (
                    <Button type="link" onClick={() => openMealModal(record)}>
                        {text}
                    </Button>
                ),
            },
            {
                title: 'Kategori',
                dataIndex: 'category',
                key: 'category',
                render: (cat) => <Tag color="blue">{cat || '-'}</Tag>,
            },
            {
                title: 'Ortalama Puan',
                key: 'avgRating',
                render: (_, record) => {
                    const avg = calculateAverageRating(record.menuPoints);
                    return (
                        <Space>
                            <Rate disabled defaultValue={Math.round(avg)} count={5} style={{ fontSize: 14 }} />
                            <Text strong>{formatRating(avg)}</Text>
                        </Space>
                    );
                },
                sorter: (a, b) => calculateAverageRating(a.menuPoints) - calculateAverageRating(b.menuPoints),
                defaultSortOrder: 'descend',
            },
            {
                title: 'Puan Sayısı',
                key: 'ratingCount',
                render: (_, record) => (
                    <Tag icon={<StarOutlined />}>{record.menuPoints?.length || 0}</Tag>
                ),
            },
            {
                title: 'Yorum Sayısı',
                key: 'commentCount',
                render: (_, record) => (
                    <Tag icon={<MessageOutlined />}>{record.menuComments?.length || 0}</Tag>
                ),
            },
            {
                title: 'Servis Sayısı',
                dataIndex: 'occurrences',
                key: 'occurrences',
                render: (count) => (
                    <Tag color="green">{count || 1} kez</Tag>
                ),
            },
            {
                title: 'Kalori',
                key: 'calories',
                render: (_, record) => {
                    const avgCal = record.occurrences > 1
                        ? Math.round(record.totalCalories / record.occurrences)
                        : record.calories || 0;
                    return `${avgCal} kcal`;
                },
            },
            {
                title: 'İşlem',
                key: 'action',
                render: (_, record) => (
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openMealModal(record)}
                    >
                        Detay
                    </Button>
                ),
            },
        ];

        return (
            <div>
                {/* Filtreler */}
                <Card style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={8}>
                            <Search
                                placeholder="Yemek adı ara..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                onSearch={(value) => setSearchTerm(value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={8}>
                            <Select
                                placeholder="Kategori seçin"
                                value={selectedCategory || undefined}
                                onChange={(value) => {
                                    setSelectedCategory(value || '');
                                    setCurrentPage(1);
                                }}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {categories.map(cat => (
                                    <Option key={cat} value={cat}>{cat}</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Space>
                                <Button
                                    icon={<FilterOutlined />}
                                    onClick={resetFilters}
                                >
                                    Filtreleri Temizle
                                </Button>
                                <Text type="secondary">
                                    {filteredMeals.length} yemek bulundu
                                </Text>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Tablo */}
                <Card title="Yemekler Puan Sıralaması">
                    <Table
                        dataSource={paginatedMeals}
                        columns={columns}
                        rowKey={(record) => record.foodName || record.id}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredMeals.length,
                            onChange: (page) => setCurrentPage(page),
                            showSizeChanger: false,
                            showTotal: (total) => `Toplam ${total} yemek`,
                        }}
                        loading={loading}
                        size="middle"
                    />
                </Card>
            </div>
        );
    };

    /**
     * Günlük Trendler Sekmesi
     */
    const renderDailyTab = () => {
        const paginatedDailyAverages = dailyAverages.slice(
            (dailyCurrentPage - 1) * pageSize,
            dailyCurrentPage * pageSize
        );

        // SVG Chart Data
        const chartData = dailyAverages.slice(0, chartPeriod === '1week' ? 7 : chartPeriod === '1month' ? 30 : dailyAverages.length);

        return (
            <div>
                {/* Filtreler */}
                <Card style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={6}>
                            <Select
                                value={chartPeriod}
                                onChange={setChartPeriod}
                                style={{ width: '100%' }}
                            >
                                <Option value="1week">1 Hafta</Option>
                                <Option value="1month">1 Ay</Option>
                                <Option value="custom">Özel Aralık</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={10}>
                            <RangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                format="DD.MM.YYYY"
                                style={{ width: '100%' }}
                                placeholder={['Başlangıç', 'Bitiş']}
                            />
                        </Col>
                        <Col xs={24} sm={4}>
                            <Button
                                type="primary"
                                icon={<BarChartOutlined />}
                                onClick={loadDailyAverages}
                                loading={loading}
                                block
                            >
                                Verileri Getir
                            </Button>
                        </Col>
                        <Col xs={24} sm={4}>
                            <Button
                                type={showChart ? 'primary' : 'default'}
                                icon={<LineChartOutlined />}
                                onClick={() => setShowChart(!showChart)}
                                block
                            >
                                {showChart ? 'Grafiği Gizle' : 'Grafiği Göster'}
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* SVG Chart */}
                {showChart && chartData.length > 0 && (
                    <Card
                        title={`Puan Trend Grafiği (${chartPeriod === '1week' ? '1 Hafta' : chartPeriod === '1month' ? '1 Ay' : 'Özel Aralık'})`}
                        style={{ marginBottom: 16 }}
                    >
                        <div style={{ overflowX: 'auto' }}>
                            <svg width="100%" height="300" viewBox="0 0 800 300" style={{ minWidth: 600 }}>
                                {/* Grid lines */}
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <line
                                        key={rating}
                                        x1="60"
                                        y1={240 - (rating * 40)}
                                        x2="780"
                                        y2={240 - (rating * 40)}
                                        stroke="#e8e8e8"
                                        strokeWidth="1"
                                        strokeDasharray="3,3"
                                    />
                                ))}

                                {/* Y-axis labels */}
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <text
                                        key={rating}
                                        x="50"
                                        y={245 - (rating * 40)}
                                        fontSize="12"
                                        fill="#666"
                                        textAnchor="end"
                                    >
                                        {rating}
                                    </text>
                                ))}

                                {/* Line path */}
                                {chartData.length > 1 && (
                                    <path
                                        d={chartData.map((item, index) => {
                                            const x = 60 + (index * (720 / Math.max(chartData.length - 1, 1)));
                                            const y = 240 - ((item.averageRating || 0) * 40);
                                            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ')}
                                        stroke="#1890ff"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}

                                {/* Data points */}
                                {chartData.map((item, index) => {
                                    const x = 60 + (index * (720 / Math.max(chartData.length - 1, 1)));
                                    const y = 240 - ((item.averageRating || 0) * 40);
                                    return (
                                        <Tooltip key={index} title={`${formatDate(item.date)}: ${formatRating(item.averageRating)}`}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r="6"
                                                fill="#1890ff"
                                                stroke="white"
                                                strokeWidth="2"
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </Tooltip>
                                    );
                                })}

                                {/* X-axis labels */}
                                {chartData.map((item, index) => {
                                    const x = 60 + (index * (720 / Math.max(chartData.length - 1, 1)));
                                    const shouldShow = chartData.length <= 7 ||
                                        index % Math.ceil(chartData.length / 7) === 0 ||
                                        index === chartData.length - 1;

                                    if (!shouldShow) return null;

                                    return (
                                        <text
                                            key={index}
                                            x={x}
                                            y="280"
                                            fontSize="10"
                                            fill="#666"
                                            textAnchor="middle"
                                        >
                                            {dayjs(item.date).format('DD.MM')}
                                        </text>
                                    );
                                })}
                            </svg>
                        </div>
                    </Card>
                )}

                {/* Günlük Ortalamalar Listesi */}
                {dailyAverages.length > 0 ? (
                    <Card title={`Günlük Puan Ortalamaları (${dailyAverages.length} gün)`}>
                        <List
                            dataSource={paginatedDailyAverages}
                            pagination={{
                                current: dailyCurrentPage,
                                pageSize: pageSize,
                                total: dailyAverages.length,
                                onChange: (page) => setDailyCurrentPage(page),
                                showTotal: (total) => `Toplam ${total} gün`,
                            }}
                            renderItem={(daily) => {
                                const percentage = ((daily.averageRating || 0) / 5) * 100;
                                return (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={
                                                <Space>
                                                    <CalendarOutlined />
                                                    {formatDate(daily.date)}
                                                </Space>
                                            }
                                        />
                                        <div style={{ width: '60%', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <Progress
                                                percent={percentage}
                                                size="small"
                                                style={{ flex: 1 }}
                                                strokeColor={percentage >= 60 ? '#52c41a' : percentage >= 40 ? '#faad14' : '#ff4d4f'}
                                            />
                                            <Text strong style={{ minWidth: 50 }}>
                                                {formatRating(daily.averageRating)}
                                            </Text>
                                            <Tag>{daily.totalRatings || 0} puan</Tag>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                ) : (
                    <Card>
                        <Empty description="Tarih aralığı seçip 'Verileri Getir' butonuna tıklayın." />
                    </Card>
                )}
            </div>
        );
    };

    /**
     * Yorum Analizi Sekmesi
     */
    const renderCommentsTab = () => {
        const paginatedComments = dateRangeComments.slice(
            (commentsCurrentPage - 1) * pageSize,
            commentsCurrentPage * pageSize
        );

        return (
            <div>
                {/* Tarih Filtresi */}
                <Card style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12}>
                            <Space>
                                <Text strong>Tarih Aralığı:</Text>
                                <RangePicker
                                    value={commentsDateRange}
                                    onChange={setCommentsDateRange}
                                    format="DD.MM.YYYY"
                                    placeholder={['Başlangıç', 'Bitiş']}
                                />
                            </Space>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Button
                                type="primary"
                                icon={<CalendarOutlined />}
                                onClick={loadCommentsByDateRange}
                                loading={loading}
                            >
                                Yorumları Getir
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Yorumlar Listesi */}
                {dateRangeComments.length > 0 ? (
                    <Card
                        title={
                            <Space>
                                <CommentOutlined />
                                <span>Tarih Aralığı Yorumları</span>
                                <Badge count={dateRangeComments.length} style={{ backgroundColor: '#1890ff' }} />
                            </Space>
                        }
                    >
                        <List
                            dataSource={paginatedComments}
                            pagination={{
                                current: commentsCurrentPage,
                                pageSize: pageSize,
                                total: dateRangeComments.length,
                                onChange: (page) => setCommentsCurrentPage(page),
                                showTotal: (total) => `Toplam ${total} yorum`,
                            }}
                            renderItem={(comment) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<UserOutlined style={{ fontSize: 20 }} />}
                                        title={
                                            <Space wrap>
                                                <Text strong>{comment.mealMenu?.foodName || 'Bilinmeyen Yemek'}</Text>
                                                <Tag color="blue">{comment.mealMenu?.category}</Tag>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    <ClockCircleOutlined /> {formatDate(comment.createdDate)}
                                                </Text>
                                            </Space>
                                        }
                                        description={
                                            <Paragraph style={{ marginBottom: 0 }}>
                                                {comment.comment}
                                            </Paragraph>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                ) : (
                    <Card>
                        <Empty description="Tarih aralığı seçip 'Yorumları Getir' butonuna tıklayın." />
                    </Card>
                )}
            </div>
        );
    };

    // ============================================================
    // YEMEK DETAY MODAL
    // ============================================================

    const renderMealModal = () => {
        if (!selectedMeal) return null;

        const avgRating = calculateAverageRating(selectedMeal.menuPoints);
        const avgCalories = selectedMeal.occurrences > 1
            ? Math.round(selectedMeal.totalCalories / selectedMeal.occurrences)
            : selectedMeal.calories || 0;

        return (
            <Modal
                title={
                    <Space>
                        <span>{selectedMeal.foodName}</span>
                        <Tag color="blue">{selectedMeal.category}</Tag>
                    </Space>
                }
                open={mealModalVisible}
                onCancel={() => setMealModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setMealModalVisible(false)}>
                        Kapat
                    </Button>
                ]}
                width={600}
            >
                {/* Genel Bilgiler */}
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Card size="small">
                            <Statistic
                                title="Ortalama Puan"
                                value={formatRating(avgRating)}
                                suffix="/ 5"
                                prefix={<StarOutlined style={{ color: '#faad14' }} />}
                            />
                            <Rate disabled value={Math.round(avgRating)} style={{ marginTop: 8 }} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card size="small">
                            <Statistic
                                title="Ortalama Kalori"
                                value={avgCalories}
                                suffix="kcal"
                            />
                        </Card>
                    </Col>
                </Row>

                <Divider />

                {/* İstatistikler */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                        <Statistic
                            title="Toplam Puan"
                            value={selectedMeal.menuPoints?.length || 0}
                            prefix={<StarOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Toplam Yorum"
                            value={selectedMeal.menuComments?.length || 0}
                            prefix={<MessageOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Servis Sayısı"
                            value={selectedMeal.occurrences || 1}
                            prefix={<CalendarOutlined />}
                        />
                    </Col>
                </Row>

                {/* Son Yorumlar */}
                {selectedMeal.menuComments?.length > 0 && (
                    <>
                        <Divider>Son Yorumlar</Divider>
                        <List
                            dataSource={selectedMeal.menuComments.slice(0, 5)}
                            renderItem={(comment, index) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<UserOutlined />}
                                        title={
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {formatDate(comment.createdDate)}
                                            </Text>
                                        }
                                        description={comment.comment}
                                    />
                                </List.Item>
                            )}
                        />
                    </>
                )}
            </Modal>
        );
    };

    // ============================================================
    // ANA RENDER
    // ============================================================

    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
                    <DashboardOutlined />
                    Genel Bakış
                </span>
            ),
            children: renderOverviewTab(),
        },
        {
            key: 'meals',
            label: (
                <span>
                    <PieChartOutlined />
                    Yemek Analizi
                </span>
            ),
            children: renderMealsTab(),
        },
        {
            key: 'daily',
            label: (
                <span>
                    <LineChartOutlined />
                    Günlük Trendler
                </span>
            ),
            children: renderDailyTab(),
        },
        {
            key: 'comments',
            label: (
                <span>
                    <CommentOutlined />
                    Yorum Analizi
                </span>
            ),
            children: renderCommentsTab(),
        },
    ];

    return (
        <div className="reports-container">
            {/* Başlık */}
            <Card style={{ marginBottom: 16 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            <Title level={4} style={{ marginBottom: 0 }}>Yemekhane Raporları</Title>
                            {isAdmin && <Tag color="red">Admin</Tag>}
                            {isYemekhaneAdmin && !isAdmin && <Tag color="orange">RaporAdmin</Tag>}
                        </Space>
                    </Col>
                    <Col>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadOverviewData}
                            loading={loading}
                        >
                            Yenile
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Hata Mesajı */}
            {error && (
                <Alert
                    message="Hata"
                    description={error}
                    type="error"
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Yükleniyor */}
            <Spin spinning={loading}>
                {/* Sekmeler */}
                <Card>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        size="large"
                    />
                </Card>
            </Spin>

            {/* Yemek Detay Modal */}
            {renderMealModal()}
        </div>
    );
};

export default Reports;