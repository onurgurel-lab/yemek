import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Statistic, Row, Col, Progress, DatePicker, List, Avatar, Rate, Tag, Empty, Spin, Typography, Alert } from 'antd';
import { BarChartOutlined, LineChartOutlined, CommentOutlined, UserOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
    fetchGeneralStats,
    fetchDailyAverages,
    fetchMealsByRating,
    selectGeneralStats,
    selectDailyAverages,
    selectMealsByRating,
    selectLoading
} from '@/store/slices/yemekhaneSlice';
import reportService from '@/services/reportService';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Reports = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { canManageMenu } = useUserRoles();

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

    // Check permissions - useUserRoles hook'undan alınan canManageMenu kullanılıyor
    const hasPermission = canManageMenu;

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
        if (dates && dates[0] && dates[1]) {
            setDateRange(dates);
        }
    };

    // Handle single date change
    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate(date);
            loadCommentsByDate(date);
        }
    };

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

    // Tab items
    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
                    <BarChartOutlined />
                    Genel Bakış
                </span>
            ),
            children: (
                <div>
                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Toplam Menü"
                                    value={generalStats?.totalMenus || 0}
                                    prefix={<FireOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Toplam Puan"
                                    value={generalStats?.totalPoints || 0}
                                    prefix={<StarOutlined />}
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
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Ortalama Puan"
                                    value={generalStats?.averageRating?.toFixed(2) || '0.00'}
                                    suffix="/ 5"
                                    prefix={<StarOutlined style={{ color: '#faad14' }} />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Rating Distribution */}
                    <Card title="Puan Dağılımı" style={{ marginBottom: 24 }}>
                        {generalStats?.ratingDistribution ? (
                            <Row gutter={[16, 16]}>
                                {[5, 4, 3, 2, 1].map(rating => {
                                    const count = generalStats.ratingDistribution[rating] || 0;
                                    const total = Object.values(generalStats.ratingDistribution).reduce((a, b) => a + b, 0);
                                    const percent = total > 0 ? (count / total) * 100 : 0;
                                    return (
                                        <Col span={24} key={rating}>
                                            <Row align="middle">
                                                <Col span={3}>
                                                    <Rate disabled defaultValue={rating} count={rating} />
                                                </Col>
                                                <Col span={18}>
                                                    <Progress percent={percent} showInfo={false} />
                                                </Col>
                                                <Col span={3} style={{ textAlign: 'right' }}>
                                                    <Text>{count} oy</Text>
                                                </Col>
                                            </Row>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ) : (
                            <Empty description="Veri bulunamadı" />
                        )}
                    </Card>
                </div>
            ),
        },
        {
            key: 'daily',
            label: (
                <span>
                    <LineChartOutlined />
                    Günlük Ortalamalar
                </span>
            ),
            children: (
                <div>
                    <Card>
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                            <Col>
                                <Text strong>Tarih Aralığı:</Text>
                                <RangePicker
                                    value={dateRange}
                                    onChange={handleDateRangeChange}
                                    format="DD.MM.YYYY"
                                    style={{ marginLeft: 8 }}
                                />
                            </Col>
                        </Row>

                        <Table
                            loading={loading}
                            dataSource={dailyAverages || []}
                            rowKey="date"
                            columns={[
                                {
                                    title: 'Tarih',
                                    dataIndex: 'date',
                                    key: 'date',
                                    render: (date) => dayjs(date).format('DD MMMM YYYY'),
                                },
                                {
                                    title: 'Ortalama Puan',
                                    dataIndex: 'averageRating',
                                    key: 'averageRating',
                                    render: (val) => (
                                        <span>
                                            <Rate disabled defaultValue={Math.round(val)} count={5} style={{ fontSize: 14 }} />
                                            <Text style={{ marginLeft: 8 }}>{val?.toFixed(2)}</Text>
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Puan Sayısı',
                                    dataIndex: 'pointCount',
                                    key: 'pointCount',
                                },
                                {
                                    title: 'Yorum Sayısı',
                                    dataIndex: 'commentCount',
                                    key: 'commentCount',
                                },
                            ]}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </div>
            ),
        },
        {
            key: 'meals',
            label: (
                <span>
                    <StarOutlined />
                    Yemek Puanları
                </span>
            ),
            children: (
                <div>
                    <Card>
                        <Table
                            loading={loading}
                            dataSource={mealsByRating || []}
                            rowKey="id"
                            columns={[
                                {
                                    title: 'Yemek Adı',
                                    dataIndex: 'foodName',
                                    key: 'foodName',
                                },
                                {
                                    title: 'Kategori',
                                    dataIndex: 'category',
                                    key: 'category',
                                    render: (cat) => <Tag>{cat}</Tag>,
                                },
                                {
                                    title: 'Ortalama Puan',
                                    dataIndex: 'averageRating',
                                    key: 'averageRating',
                                    sorter: (a, b) => a.averageRating - b.averageRating,
                                    render: (val) => (
                                        <span>
                                            <Rate disabled defaultValue={Math.round(val)} count={5} style={{ fontSize: 14 }} />
                                            <Text style={{ marginLeft: 8 }}>{val?.toFixed(2)}</Text>
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Toplam Oy',
                                    dataIndex: 'totalVotes',
                                    key: 'totalVotes',
                                    sorter: (a, b) => a.totalVotes - b.totalVotes,
                                },
                            ]}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </div>
            ),
        },
        {
            key: 'comments',
            label: (
                <span>
                    <CommentOutlined />
                    Yorumlar
                </span>
            ),
            children: (
                <div>
                    <Row gutter={[16, 16]}>
                        {/* Today's Comments */}
                        <Col xs={24} lg={12}>
                            <Card title="Bugünün Yorumları">
                                {todayComments.length > 0 ? (
                                    <List
                                        dataSource={todayComments}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    avatar={<Avatar icon={<UserOutlined />} />}
                                                    title={
                                                        <span>
                                                            {item.userName || 'Anonim'}
                                                            <Rate disabled defaultValue={item.rating} count={5} style={{ fontSize: 12, marginLeft: 8 }} />
                                                        </span>
                                                    }
                                                    description={item.comment}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty description="Bugün yorum yapılmamış" />
                                )}
                            </Card>
                        </Col>

                        {/* Comments by Date */}
                        <Col xs={24} lg={12}>
                            <Card
                                title={
                                    <span>
                                        Tarihe Göre Yorumlar
                                        <DatePicker
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                            format="DD.MM.YYYY"
                                            style={{ marginLeft: 16 }}
                                        />
                                    </span>
                                }
                            >
                                <Spin spinning={commentsLoading}>
                                    {dateComments.length > 0 ? (
                                        <List
                                            dataSource={dateComments}
                                            renderItem={(item) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={<Avatar icon={<UserOutlined />} />}
                                                        title={
                                                            <span>
                                                                {item.userName || 'Anonim'}
                                                                <Rate disabled defaultValue={item.rating} count={5} style={{ fontSize: 12, marginLeft: 8 }} />
                                                            </span>
                                                        }
                                                        description={item.comment}
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
            ),
        },
    ];

    return (
        <div className="reports">
            <Card title={<Title level={4}>Raporlar</Title>}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Card>
        </div>
    );
};

export default Reports;