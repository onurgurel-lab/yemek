import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Table,
  Progress,
  Space,
  Select,
  Typography,
  Spin,
  Empty,
} from 'antd';
import {
  BarChartOutlined,
  StarOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  getGeneralStats,
  getDailyAverages,
  getMealsByRating,
  getDashboardSummary,
} from '@/services/reportService';
import { useNotification } from '@/hooks/useNotification';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const { t } = useTranslation();
  const { showError } = useNotification();

  // State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [dailyAverages, setDailyAverages] = useState([]);
  const [topRatedMeals, setTopRatedMeals] = useState([]);
  const [lowRatedMeals, setLowRatedMeals] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [reportType, setReportType] = useState('general');

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const [statsData, dailyData, topMeals, lowMeals] = await Promise.all([
        getGeneralStats(startDate, endDate),
        getDailyAverages(startDate, endDate),
        getMealsByRating(startDate, endDate, 'desc', 10),
        getMealsByRating(startDate, endDate, 'asc', 10),
      ]);

      setStats(statsData);
      setDailyAverages(dailyData);
      setTopRatedMeals(topMeals);
      setLowRatedMeals(lowMeals);
    } catch (error) {
      showError(t('yemekhane.reports.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and date range change
  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    }
  };

  // Handle export
  const handleExport = () => {
    // Export logic will be implemented
    console.log('Export report');
  };

  // Table columns for top/low rated meals
  const mealColumns = [
    {
      title: t('yemekhane.reports.mealName'),
      dataIndex: 'foodName',
      key: 'foodName',
      ellipsis: true,
    },
    {
      title: t('yemekhane.reports.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: t('yemekhane.reports.avgRating'),
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 150,
      render: (rating) => (
        <Space>
          <StarOutlined style={{ color: '#fadb14' }} />
          <span>{rating?.toFixed(2) || '-'}</span>
        </Space>
      ),
    },
    {
      title: t('yemekhane.reports.totalVotes'),
      dataIndex: 'totalVotes',
      key: 'totalVotes',
      width: 100,
    },
  ];

  // Daily averages table columns
  const dailyColumns = [
    {
      title: t('yemekhane.reports.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: t('yemekhane.mealTimes.breakfast'),
      dataIndex: 'breakfast',
      key: 'breakfast',
      render: (val) => val?.toFixed(2) || '-',
    },
    {
      title: t('yemekhane.mealTimes.lunch'),
      dataIndex: 'lunch',
      key: 'lunch',
      render: (val) => val?.toFixed(2) || '-',
    },
    {
      title: t('yemekhane.mealTimes.dinner'),
      dataIndex: 'dinner',
      key: 'dinner',
      render: (val) => val?.toFixed(2) || '-',
    },
    {
      title: t('yemekhane.reports.dailyAvg'),
      dataIndex: 'dailyAverage',
      key: 'dailyAverage',
      render: (val) => (
        <Space>
          <StarOutlined style={{ color: '#fadb14' }} />
          <span>{val?.toFixed(2) || '-'}</span>
        </Space>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Space>
              <CalendarOutlined />
              <Text strong>{t('yemekhane.reports.dateRange')}:</Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD.MM.YYYY"
                allowClear={false}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: 150 }}
              >
                <Option value="general">{t('yemekhane.reports.general')}</Option>
                <Option value="detailed">{t('yemekhane.reports.detailed')}</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={fetchReportData}>
                {t('common.refresh')}
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                {t('yemekhane.reports.export')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('yemekhane.reports.totalMeals')}
              value={stats?.totalMeals || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('yemekhane.reports.avgRating')}
              value={stats?.averageRating || 0}
              precision={2}
              prefix={<StarOutlined style={{ color: '#fadb14' }} />}
              suffix="/ 5"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('yemekhane.reports.totalVotes')}
              value={stats?.totalVotes || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('yemekhane.reports.participationRate')}
              value={stats?.participationRate || 0}
              suffix="%"
              prefix={
                stats?.participationRate > 50 ? (
                  <RiseOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <FallOutlined style={{ color: '#f5222d' }} />
                )
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Rating Distribution */}
      <Card title={t('yemekhane.reports.ratingDistribution')}>
        <Row gutter={[24, 16]}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats?.ratingDistribution?.[rating] || 0;
            const total = stats?.totalVotes || 1;
            const percent = Math.round((count / total) * 100);
            return (
              <Col xs={24} key={rating}>
                <Row align="middle" gutter={[8, 0]}>
                  <Col span={2}>
                    <Space>
                      <StarOutlined style={{ color: '#fadb14' }} />
                      <span>{rating}</span>
                    </Space>
                  </Col>
                  <Col span={18}>
                    <Progress
                      percent={percent}
                      strokeColor={
                        rating >= 4
                          ? '#52c41a'
                          : rating >= 3
                          ? '#faad14'
                          : '#f5222d'
                      }
                      showInfo={false}
                    />
                  </Col>
                  <Col span={4} className="text-right">
                    <Text type="secondary">
                      {count} ({percent}%)
                    </Text>
                  </Col>
                </Row>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Top and Low Rated Meals */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                {t('yemekhane.reports.topRatedMeals')}
              </Space>
            }
          >
            <Table
              dataSource={topRatedMeals}
              columns={mealColumns}
              pagination={false}
              size="small"
              rowKey="id"
              locale={{ emptyText: <Empty description={t('common.noData')} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FallOutlined style={{ color: '#f5222d' }} />
                {t('yemekhane.reports.lowRatedMeals')}
              </Space>
            }
          >
            <Table
              dataSource={lowRatedMeals}
              columns={mealColumns}
              pagination={false}
              size="small"
              rowKey="id"
              locale={{ emptyText: <Empty description={t('common.noData')} /> }}
            />
          </Card>
        </Col>
      </Row>

      {/* Daily Averages Table */}
      <Card title={t('yemekhane.reports.dailyAverages')}>
        <Table
          dataSource={dailyAverages}
          columns={dailyColumns}
          pagination={{ pageSize: 10 }}
          size="small"
          rowKey="date"
          loading={loading}
          locale={{ emptyText: <Empty description={t('common.noData')} /> }}
        />
      </Card>
    </div>
  );
};

export default Reports;
