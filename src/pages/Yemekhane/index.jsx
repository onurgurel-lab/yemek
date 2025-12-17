import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Tabs,
  DatePicker,
  Button,
  Space,
  Spin,
  Empty,
  Row,
  Col,
  Tag,
  Typography,
  Divider,
} from 'antd';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  fetchMenuByDate,
  fetchTodayMenu,
  setSelectedDate,
  selectTodayMenu,
  selectMenuByDate,
  selectYemekhaneLoading,
  selectSelectedDate,
} from '@/store/slices/yemekhaneSlice';
import { useNotification } from '@/hooks/useNotification';
import { MEAL_TIMES } from '@/constants/mealMenuApi';

// Sub-components
import MenuView from './components/MenuView';
import MenuManagement from './components/MenuManagement';
import ExcelUpload from './components/ExcelUpload';
import Reports from './components/Reports';

const { Title, Text } = Typography;

const Yemekhane = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useNotification();

  // Redux state
  const todayMenu = useSelector(selectTodayMenu);
  const menuByDate = useSelector(selectMenuByDate);
  const loading = useSelector(selectYemekhaneLoading);
  const selectedDate = useSelector(selectSelectedDate);

  // Local state
  const [activeTab, setActiveTab] = useState('view');

  // Determine active tab from URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['view', 'manage', 'upload', 'reports'].includes(path)) {
      setActiveTab(path);
    } else {
      setActiveTab('view');
    }
  }, [location]);

  // Fetch today's menu on mount
  useEffect(() => {
    dispatch(fetchTodayMenu());
  }, [dispatch]);

  // Handle date change
  const handleDateChange = (date) => {
    if (date) {
      const formattedDate = date.format('YYYY-MM-DD');
      dispatch(setSelectedDate(formattedDate));
      dispatch(fetchMenuByDate(formattedDate));
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/yemekhane/${key}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedDate) {
      dispatch(fetchMenuByDate(selectedDate));
    } else {
      dispatch(fetchTodayMenu());
    }
  };

  // Tab items
  const tabItems = [
    {
      key: 'view',
      label: (
        <span>
          <CalendarOutlined />
          {t('yemekhane.menuView')}
        </span>
      ),
      children: <MenuView />,
    },
    {
      key: 'manage',
      label: (
        <span>
          <UnorderedListOutlined />
          {t('yemekhane.menuManagement')}
        </span>
      ),
      children: <MenuManagement />,
    },
    {
      key: 'upload',
      label: (
        <span>
          <UploadOutlined />
          {t('yemekhane.excelUpload')}
        </span>
      ),
      children: <ExcelUpload />,
    },
    {
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined />
          {t('yemekhane.reports')}
        </span>
      ),
      children: <Reports />,
    },
  ];

  return (
    <div className="p-6">
      {/* Header Card */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t('yemekhane.title')}
            </Title>
            <Text type="secondary">{t('yemekhane.subtitle')}</Text>
          </Col>
          <Col>
            <Space>
              <DatePicker
                value={selectedDate ? dayjs(selectedDate) : dayjs()}
                onChange={handleDateChange}
                format="DD.MM.YYYY"
                allowClear={false}
              />
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                {t('common.refresh')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Today's Menu Summary */}
      {todayMenu && activeTab === 'view' && (
        <Card className="mb-4">
          <Title level={5}>{t('yemekhane.todayMenu')}</Title>
          <Row gutter={[16, 16]}>
            {MEAL_TIMES.map((mealTime) => {
              const mealData = todayMenu[mealTime.key];
              return (
                <Col xs={24} sm={12} md={8} key={mealTime.key}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span>{mealTime.icon}</span>
                        <span>{t(`yemekhane.mealTimes.${mealTime.key}`)}</span>
                      </Space>
                    }
                    className="h-full"
                  >
                    {mealData && mealData.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {mealData.slice(0, 4).map((item, index) => (
                          <li key={index} className="text-sm truncate">
                            {item.foodName}
                          </li>
                        ))}
                        {mealData.length > 4 && (
                          <li className="text-sm text-gray-400">
                            +{mealData.length - 4} {t('common.more')}
                          </li>
                        )}
                      </ul>
                    ) : (
                      <Text type="secondary">{t('yemekhane.noMenu')}</Text>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* Main Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default Yemekhane;
