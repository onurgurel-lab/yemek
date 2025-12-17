import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Statistic, Row, Col, Progress, DatePicker, List, Avatar, Rate, Tag, Empty, Spin, Typography, Alert } from 'antd';
import { BarChartOutlined, LineChartOutlined, CommentOutlined, UserOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { canManageMenu } from '@/constants/yemekhaneRoutes';
import {
    fetchGeneralStats,
    fetchDailyAverages,
    fetchMealsByRating,
    selectGeneralStats,
    selectDailyAverages,
    selectMealsByRating,
    selectLoading
} from '@/store/slices/yemekhaneSlice';
import * as reportService from '@/services/reportService';
import { RATING_DESCRIPTIONS, getCategoryColor } from '@/constants/mealMenuApi';
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
            setTodayComments(response?.data || response || []);
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
            setDateComments(response?.data || response || []);
        } catch (error) {
            console.error('Tarih yorumları yüklenirken hata:', error);
            setDateComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, []);

    // Handle date change for comments
    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate(date);
            loadCommentsByDate(date);
        }
    };

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

    // Overview Tab Content
    const OverviewTab = () => (
        <div>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Toplam Menü Öğesi"
                            value={generalStats?.totalMenuItems || 0}
                            prefix={<FireOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Toplam Değerlendirme"
                            value={generalStats?.totalRatings || 0}
                            prefix={<StarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Ortalama Puan"
                            value={generalStats?.averageRating || 0}
                            precision={2}
                            suffix="/ 5"
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Toplam Yorum"
                            value={generalStats?.totalComments || 0}
                            prefix={<CommentOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Top and Low Rated Meals */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="En Beğenilen Yemekler" extra={<StarOutlined style={{ color: '#52c41a' }} />}>
                        {mealsByRating && mealsByRating.length > 0 ? (
                            <List
                                dataSource={mealsByRating.filter(m => m.averageRating >= 4).slice(0, 5)}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar style={{ backgroundColor: '#52c41a' }}>
                                                    {index + 1}
                                                </Avatar>
                                            }
                                            title={item.foodName}
                                            description={
                                                <Space>
                                                    <Rate disabled value={item.averageRating} allowHalf />
                                                    <Text>({item.ratingCount} değerlendirme)</Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="Henüz veri yok" />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Geliştirilmesi Gereken Yemekler" extra={<StarOutlined style={{ color: '#ff4d4f' }} />}>
                        {mealsByRating && mealsByRating.length > 0 ? (
                            <List
                                dataSource={mealsByRating.filter(m => m.averageRating < 3).slice(0, 5)}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar style={{ backgroundColor: '#ff4d4f' }}>
                                                    {index + 1}
                                                </Avatar>
                                            }
                                            title={item.foodName}
                                            description={
                                                <Space>
                                                    <Rate disabled value={item.averageRating} allowHalf />
                                                    <Text>({item.ratingCount} değerlendirme)</Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="Henüz veri yok" />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );

    // Daily Averages Tab Content
    const DailyAveragesTab = () => (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Text strong>Tarih Aralığı: </Text>
                <RangePicker
                    value={dateRange}
                    onChange={(dates) => dates && setDateRange(dates)}
                    format="DD.MM.YYYY"
                />
            </div>

            <Table
                dataSource={dailyAverages || []}
                columns={[
                    {
                        title: 'Tarih',
                        dataIndex: 'date',
                        key: 'date',
                        render: (date) => dayjs(date).format('DD.MM.YYYY dddd')
                    },
                    {
                        title: 'Ortalama Puan',
                        dataIndex: 'averageRating',
                        key: 'averageRating',
                        render: (rating) => (
                            <Space>
                                <Rate disabled value={rating} allowHalf />
                                <Text>({rating?.toFixed(2)})</Text>
                            </Space>
                        ),
                        sorter: (a, b) => a.averageRating - b.averageRating
                    },
                    {
                        title: 'Değerlendirme Sayısı',
                        dataIndex: 'ratingCount',
                        key: 'ratingCount',
                        sorter: (a, b) => a.ratingCount - b.ratingCount
                    },
                    {
                        title: 'Yorum Sayısı',
                        dataIndex: 'commentCount',
                        key: 'commentCount',
                        sorter: (a, b) => a.commentCount - b.commentCount
                    }
                ]}
                loading={loading}
                rowKey="date"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Bu tarih aralığında veri bulunamadı' }}
            />
        </div>
    );

    // Comments Tab Content
    const CommentsTab = () => (
        <div>
            <Row gutter={[16, 16]}>
                {/* Today's Comments */}
                <Col xs={24} md={12}>
                    <Card title="Bugünün Yorumları" extra={<CommentOutlined />}>
                        {todayComments && todayComments.length > 0 ? (
                            <List
                                dataSource={todayComments}
                                renderItem={(comment) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} />}
                                            title={
                                                <Space>
                                                    <Text strong>{comment.userName || 'Anonim'}</Text>
                                                    <Rate disabled value={comment.rating} style={{ fontSize: 12 }} />
                                                </Space>
                                            }
                                            description={comment.comment}
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="Bugün henüz yorum yapılmamış" />
                        )}
                    </Card>
                </Col>

                {/* Comments by Date */}
                <Col xs={24} md={12}>
                    <Card
                        title="Tarihe Göre Yorumlar"
                        extra={
                            <DatePicker
                                value={selectedDate}
                                onChange={handleDateChange}
                                format="DD.MM.YYYY"
                            />
                        }
                    >
                        <Spin spinning={commentsLoading}>
                            {dateComments && dateComments.length > 0 ? (
                                <List
                                    dataSource={dateComments}
                                    renderItem={(comment) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={
                                                    <Space>
                                                        <Text strong>{comment.userName || 'Anonim'}</Text>
                                                        <Rate disabled value={comment.rating} style={{ fontSize: 12 }} />
                                                    </Space>
                                                }
                                                description={comment.comment}
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description="Bu tarihte yorum bulunamadı" />
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    // Tab items
    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
                    <BarChartOutlined /> Genel Bakış
                </span>
            ),
            children: <OverviewTab />
        },
        {
            key: 'daily',
            label: (
                <span>
                    <LineChartOutlined /> Günlük Ortalamalar
                </span>
            ),
            children: <DailyAveragesTab />
        },
        {
            key: 'comments',
            label: (
                <span>
                    <CommentOutlined /> Yorumlar
                </span>
            ),
            children: <CommentsTab />
        }
    ];

    return (
        <div>
            <Title level={4}>Yemekhane Raporları</Title>
            <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
                Değerlendirme istatistikleri ve kullanıcı yorumlarını görüntüleyin
            </Text>

            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Spin>
        </div>
    );
};

export default Reports;