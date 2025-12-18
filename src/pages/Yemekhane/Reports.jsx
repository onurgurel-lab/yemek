import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Statistic, Row, Col, Progress, DatePicker, List, Avatar, Rate, Tag, Empty, Spin, Typography, Alert } from 'antd';
import { BarChartOutlined, LineChartOutlined, CommentOutlined, UserOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { canManageMenu } from '@/routes/yemekhaneRoutes';
import {
    fetchGeneralStats,
    fetchDailyAverages,
    fetchMealsByRating,
    selectGeneralStats,
    selectDailyAverages,
    selectMealsByRating,
    selectLoading
} from '@/store/slices/yemekhaneSlice';
import { reportService } from '@/services/reportService';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Reports = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();

    // Redux state
    const generalStats = useSelector(selectGeneralStats);
    const dailyAverages = useSelector(selectDailyAverages);
    const mealsByRating = useSelector(selectMealsByRating);
    const loading = useSelector(selectLoading);

    // Local state
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(30, 'day'),
        dayjs()
    ]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [todayComments, setTodayComments] = useState([]);
    const [dateComments, setDateComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Check permissions
    const hasPermission = canManageMenu(user);

    // Load initial data
    useEffect(() => {
        if (hasPermission) {
            loadData();
        }
    }, [hasPermission]);

    // Load data
    const loadData = async () => {
        dispatch(fetchGeneralStats());
        dispatch(fetchMealsByRating());
        loadTodayComments();
    };

    // Load today's comments
    const loadTodayComments = async () => {
        try {
            const response = await reportService.getTodayComments();
            setTodayComments(response?.data || []);
        } catch (error) {
            console.error('Yorumlar yüklenirken hata:', error);
        }
    };

    // Load daily averages when date range changes
    useEffect(() => {
        if (dateRange[0] && dateRange[1] && hasPermission) {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');
            dispatch(fetchDailyAverages({ startDate, endDate }));
        }
    }, [dateRange, hasPermission, dispatch]);

    // Load comments by date
    const loadCommentsByDate = useCallback(async (date) => {
        setCommentsLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const response = await reportService.getCommentsByDate(dateStr);
            setDateComments(response?.data || []);
        } catch (error) {
            console.error('Yorumlar yüklenirken hata:', error);
            setDateComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, []);

    // Handle date range change
    const handleDateRangeChange = (dates) => {
        if (dates) {
            setDateRange(dates);
        }
    };

    // Handle date change for comments
    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate(date);
            loadCommentsByDate(date);
        }
    };

    // Get rank badge
    const getRankBadge = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    // Get progress color based on rating
    const getProgressColor = (rating) => {
        if (rating >= 4) return '#52c41a';
        if (rating >= 3) return '#faad14';
        return '#ff4d4f';
    };

    // Format date
    const formatDate = (dateString) => {
        return dayjs(dateString).format('DD.MM.YYYY');
    };

    // Top meals table columns
    const topMealsColumns = [
        {
            title: 'Sıra',
            key: 'rank',
            width: 60,
            render: (_, __, index) => (
                <span style={{ fontSize: index < 3 ? 20 : 14 }}>
          {getRankBadge(index)}
        </span>
            )
        },
        {
            title: 'Yemek Adı',
            dataIndex: 'foodName',
            key: 'foodName'
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <Tag>{category}</Tag>
        },
        {
            title: 'Ortalama Puan',
            dataIndex: 'averageRating',
            key: 'averageRating',
            render: (rating) => (
                <Rate disabled value={rating} allowHalf style={{ fontSize: 14 }} />
            ),
            sorter: (a, b) => a.averageRating - b.averageRating
        },
        {
            title: 'Değerlendirme Sayısı',
            dataIndex: 'ratingCount',
            key: 'ratingCount',
            sorter: (a, b) => a.ratingCount - b.ratingCount
        }
    ];

    // Daily averages table columns
    const dailyAveragesColumns = [
        {
            title: 'Tarih',
            dataIndex: 'date',
            key: 'date',
            render: (date) => formatDate(date),
            sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
        },
        {
            title: 'Ortalama Puan',
            dataIndex: 'average',
            key: 'average',
            render: (avg) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Progress
                        percent={avg * 20}
                        showInfo={false}
                        strokeColor={getProgressColor(avg)}
                        style={{ width: 100 }}
                    />
                    <Text strong>{avg.toFixed(2)}</Text>
                </div>
            ),
            sorter: (a, b) => a.average - b.average
        },
        {
            title: 'Değerlendirme Sayısı',
            dataIndex: 'count',
            key: 'count',
            sorter: (a, b) => a.count - b.count
        }
    ];

    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
          <BarChartOutlined />
          Genel Bakış
        </span>
            )
        },
        {
            key: 'trends',
            label: (
                <span>
          <LineChartOutlined />
          Günlük Trendler
        </span>
            )
        },
        {
            key: 'comments',
            label: (
                <span>
          <CommentOutlined />
          Yorumlar
        </span>
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
                <Title level={3}>
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    Raporlar ve İstatistikler
                </Title>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Stats Cards */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col xs={12} sm={6}>
                                <Card>
                                    <Statistic
                                        title="Toplam Değerlendirme"
                                        value={generalStats?.totalRatings || 0}
                                        prefix={<StarOutlined style={{ color: '#faad14' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card>
                                    <Statistic
                                        title="Toplam Yorum"
                                        value={generalStats?.totalComments || 0}
                                        prefix={<CommentOutlined style={{ color: '#1890ff' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card>
                                    <Statistic
                                        title="Bugünün Ortalaması"
                                        value={generalStats?.todayAverage?.toFixed(2) || '-'}
                                        prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
                                        suffix="/ 5"
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card>
                                    <Statistic
                                        title="Aktif Kullanıcı"
                                        value={generalStats?.activeUsers || 0}
                                        prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Top Meals Table */}
                        <Title level={4}>En Çok Beğenilen Yemekler (Top 10)</Title>
                        <Table
                            dataSource={mealsByRating?.slice(0, 10) || []}
                            columns={topMealsColumns}
                            loading={loading}
                            pagination={false}
                            rowKey="id"
                            locale={{ emptyText: 'Henüz değerlendirme yapılmamış' }}
                        />
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                    <div>
                        {/* Date Range Picker */}
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ marginRight: 8 }}>Tarih Aralığı:</Text>
                            <RangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                format="DD.MM.YYYY"
                            />
                        </div>

                        {/* Daily Averages Table */}
                        <Table
                            dataSource={dailyAverages}
                            columns={dailyAveragesColumns}
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            rowKey="date"
                            locale={{ emptyText: 'Seçili tarih aralığında veri bulunamadı' }}
                        />
                    </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <Row gutter={24}>
                        {/* Today's Comments */}
                        <Col xs={24} md={12}>
                            <Title level={4}>Bugünün Yorumları</Title>
                            {todayComments.length === 0 ? (
                                <Empty description="Bugün için yorum yok" />
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={todayComments}
                                    style={{ maxHeight: 400, overflow: 'auto' }}
                                    renderItem={(comment) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                                }
                                                title={
                                                    <div>
                                                        <Text strong>{comment.userName || 'Anonim'}</Text>
                                                        {comment.rating && (
                                                            <Rate
                                                                disabled
                                                                value={comment.rating}
                                                                style={{ fontSize: 12, marginLeft: 8 }}
                                                            />
                                                        )}
                                                    </div>
                                                }
                                                description={
                                                    <>
                                                        <div>{comment.comment}</div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {comment.foodName && <Tag size="small">{comment.foodName}</Tag>}
                                                        </Text>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Col>

                        {/* Comments by Date */}
                        <Col xs={24} md={12}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                <Title level={4} style={{ margin: 0, marginRight: 16 }}>Tarihe Göre Yorumlar</Title>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    format="DD.MM.YYYY"
                                />
                            </div>

                            {commentsLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Spin />
                                </div>
                            ) : dateComments.length === 0 ? (
                                <Empty description="Seçili tarih için yorum yok" />
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={dateComments}
                                    style={{ maxHeight: 400, overflow: 'auto' }}
                                    renderItem={(comment) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                                                }
                                                title={
                                                    <div>
                                                        <Text strong>{comment.userName || 'Anonim'}</Text>
                                                        {comment.rating && (
                                                            <Rate
                                                                disabled
                                                                value={comment.rating}
                                                                style={{ fontSize: 12, marginLeft: 8 }}
                                                            />
                                                        )}
                                                    </div>
                                                }
                                                description={
                                                    <>
                                                        <div>{comment.comment}</div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {comment.foodName && <Tag size="small">{comment.foodName}</Tag>}
                                                        </Text>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Col>
                    </Row>
                )}
            </Card>
        </div>
    );
};

export default Reports;