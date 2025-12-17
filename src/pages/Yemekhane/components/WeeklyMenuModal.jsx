import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Card, Tag, Empty, Spin, Typography, Row, Col, Badge, Tooltip } from 'antd';
import { CalendarOutlined, FireOutlined } from '@ant-design/icons';
import mealMenuService from '@/services/mealMenuService';
import { MEAL_TIMES, MEAL_CATEGORIES, DAY_NAMES_FULL, getCategoryColor, getCategoryIcon } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;

const WeeklyMenuModal = ({ visible, onClose, startDate }) => {
    const [loading, setLoading] = useState(false);
    const [weekData, setWeekData] = useState({});
    const [activeTab, setActiveTab] = useState('lunch');

    // Get week days starting from startDate (Monday)
    const getWeekDays = useCallback(() => {
        const days = [];
        const start = dayjs(startDate).startOf('week').add(1, 'day'); // Monday

        for (let i = 0; i < 7; i++) {
            const date = start.add(i, 'day');
            days.push({
                date: date.format('YYYY-MM-DD'),
                dayName: DAY_NAMES_FULL[date.day()] || date.format('dddd'),
                dayNumber: date.format('D'),
                month: date.format('MMMM'),
                isToday: date.isSame(dayjs(), 'day'),
                isWeekend: date.day() === 0 || date.day() === 6
            });
        }
        return days;
    }, [startDate]);

    // Load week data
    const loadWeekData = useCallback(async () => {
        if (!startDate) return;

        setLoading(true);
        try {
            const weekDays = getWeekDays();
            const startDateStr = weekDays[0].date;
            const endDateStr = weekDays[6].date;

            const response = await mealMenuService.getMenusByDateRange(startDateStr, endDateStr);
            const menus = response?.data || [];

            // Group by date
            const grouped = {};
            weekDays.forEach(day => {
                grouped[day.date] = {
                    lunch: [],
                    dinner: []
                };
            });

            menus.forEach(menu => {
                const menuDate = dayjs(menu.menuDate).format('YYYY-MM-DD');
                if (grouped[menuDate]) {
                    if (menu.mealTime === MEAL_TIMES.LUNCH) {
                        grouped[menuDate].lunch.push(menu);
                    } else if (menu.mealTime === MEAL_TIMES.DINNER) {
                        grouped[menuDate].dinner.push(menu);
                    }
                }
            });

            setWeekData(grouped);
        } catch (error) {
            console.error('Haftalık menü yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, getWeekDays]);

    useEffect(() => {
        if (visible && startDate) {
            loadWeekData();
        }
    }, [visible, startDate, loadWeekData]);

    // Render menu items for a day
    const renderDayMenu = (dayData, mealType) => {
        const items = dayData?.[mealType] || [];

        if (items.length === 0) {
            return <Empty description="Menü yok" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        return (
            <div className="menu-items">
                {items.map((item, index) => (
                    <Tag
                        key={index}
                        color={getCategoryColor(item.category)}
                        style={{ marginBottom: 4, display: 'block' }}
                    >
                        {getCategoryIcon(item.category)} {item.foodName}
                        {item.calorie > 0 && (
                            <span style={{ marginLeft: 8, opacity: 0.7 }}>
                                <FireOutlined /> {item.calorie}
                            </span>
                        )}
                    </Tag>
                ))}
            </div>
        );
    };

    // Calculate total calories for a day
    const getDayCalories = (dayData, mealType) => {
        const items = dayData?.[mealType] || [];
        return items.reduce((sum, item) => sum + (item.calorie || 0), 0);
    };

    const weekDays = getWeekDays();

    const tabItems = [
        {
            key: 'lunch',
            label: (
                <span>
                    <CalendarOutlined /> Öğle Yemeği
                </span>
            ),
            children: (
                <Spin spinning={loading}>
                    <Row gutter={[16, 16]}>
                        {weekDays.map(day => (
                            <Col xs={24} sm={12} md={8} lg={6} xl={24 / 7} key={day.date}>
                                <Card
                                    size="small"
                                    title={
                                        <div style={{ textAlign: 'center' }}>
                                            <Text strong>{day.dayName}</Text>
                                            <br />
                                            <Text type="secondary">{day.dayNumber} {day.month}</Text>
                                        </div>
                                    }
                                    extra={
                                        day.isToday && <Badge status="processing" text="Bugün" />
                                    }
                                    style={{
                                        backgroundColor: day.isToday ? '#e6f7ff' : day.isWeekend ? '#f5f5f5' : 'white',
                                        minHeight: 200
                                    }}
                                >
                                    {renderDayMenu(weekData[day.date], 'lunch')}
                                    {getDayCalories(weekData[day.date], 'lunch') > 0 && (
                                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                                            <Tooltip title="Toplam Kalori">
                                                <Tag color="orange">
                                                    <FireOutlined /> {getDayCalories(weekData[day.date], 'lunch')} kcal
                                                </Tag>
                                            </Tooltip>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Spin>
            )
        },
        {
            key: 'dinner',
            label: (
                <span>
                    <CalendarOutlined /> Akşam Yemeği
                </span>
            ),
            children: (
                <Spin spinning={loading}>
                    <Row gutter={[16, 16]}>
                        {weekDays.map(day => (
                            <Col xs={24} sm={12} md={8} lg={6} xl={24 / 7} key={day.date}>
                                <Card
                                    size="small"
                                    title={
                                        <div style={{ textAlign: 'center' }}>
                                            <Text strong>{day.dayName}</Text>
                                            <br />
                                            <Text type="secondary">{day.dayNumber} {day.month}</Text>
                                        </div>
                                    }
                                    extra={
                                        day.isToday && <Badge status="processing" text="Bugün" />
                                    }
                                    style={{
                                        backgroundColor: day.isToday ? '#e6f7ff' : day.isWeekend ? '#f5f5f5' : 'white',
                                        minHeight: 200
                                    }}
                                >
                                    {renderDayMenu(weekData[day.date], 'dinner')}
                                    {getDayCalories(weekData[day.date], 'dinner') > 0 && (
                                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                                            <Tooltip title="Toplam Kalori">
                                                <Tag color="orange">
                                                    <FireOutlined /> {getDayCalories(weekData[day.date], 'dinner')} kcal
                                                </Tag>
                                            </Tooltip>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Spin>
            )
        }
    ];

    return (
        <Modal
            title={
                <Title level={4} style={{ margin: 0 }}>
                    <CalendarOutlined /> Haftalık Menü
                </Title>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ top: 20 }}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
        </Modal>
    );
};

export default WeeklyMenuModal;