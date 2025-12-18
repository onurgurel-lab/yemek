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

    // Group items by category
    const groupByCategory = (items) => {
        const groups = {};

        items.forEach(item => {
            const category = item.category || 'Diğer';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });

        // Sort by category order
        const categoryOrder = MEAL_CATEGORIES.map(c => c.label);
        return Object.entries(groups).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a[0]);
            const indexB = categoryOrder.indexOf(b[0]);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    };

    // Calculate total calories
    const calculateTotalCalories = (items) => {
        return items.reduce((total, item) => total + (item.calorie || 0), 0);
    };

    // Get week range text
    const getWeekRangeText = () => {
        const weekDays = getWeekDays();
        if (weekDays.length < 7) return '';

        const start = dayjs(weekDays[0].date);
        const end = dayjs(weekDays[6].date);

        if (start.month() === end.month()) {
            return `${start.format('D')} - ${end.format('D MMMM YYYY')}`;
        }
        return `${start.format('D MMMM')} - ${end.format('D MMMM YYYY')}`;
    };

    const weekDays = getWeekDays();
    const mealKey = activeTab === 'lunch' ? 'lunch' : 'dinner';

    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle Yemeği' },
        { key: 'dinner', label: '🌙 Akşam Yemeği' }
    ];

    return (
        <Modal
            title={
                <div>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    Haftalık Menü
                    <Text type="secondary" style={{ marginLeft: 12, fontSize: 14, fontWeight: 'normal' }}>
                        {getWeekRangeText()}
                    </Text>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            bodyStyle={{ padding: '12px 24px' }}
            destroyOnClose
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ marginBottom: 16 }}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Row gutter={[8, 8]}>
                    {weekDays.map((day) => {
                        const dayMenus = weekData[day.date]?.[mealKey] || [];
                        const groupedMenus = groupByCategory(dayMenus);
                        const totalCalories = calculateTotalCalories(dayMenus);

                        return (
                            <Col xs={24} sm={12} md={8} lg={24 / 7} key={day.date}>
                                <Card
                                    size="small"
                                    style={{
                                        height: '100%',
                                        borderColor: day.isToday ? '#1890ff' : (day.isWeekend ? '#f0f0f0' : '#d9d9d9'),
                                        backgroundColor: day.isToday ? '#e6f7ff' : (day.isWeekend ? '#fafafa' : '#fff')
                                    }}
                                    title={
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontWeight: day.isToday ? 'bold' : 'normal' }}>
                                                {day.dayName}
                                            </div>
                                            <Badge
                                                count={day.isToday ? 'Bugün' : null}
                                                style={{ backgroundColor: '#52c41a' }}
                                            >
                                                <Text
                                                    strong={day.isToday}
                                                    style={{ fontSize: 18 }}
                                                >
                                                    {day.dayNumber}
                                                </Text>
                                            </Badge>
                                        </div>
                                    }
                                    headStyle={{ padding: '8px', minHeight: 'auto' }}
                                    bodyStyle={{ padding: '8px', minHeight: 150 }}
                                >
                                    {dayMenus.length === 0 ? (
                                        <Empty
                                            description="Menü yok"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            style={{ margin: '20px 0' }}
                                        />
                                    ) : (
                                        <>
                                            {groupedMenus.map(([category, items]) => (
                                                <div key={category} style={{ marginBottom: 8 }}>
                                                    <Tag
                                                        color={getCategoryColor(category)}
                                                        style={{ marginBottom: 4, fontSize: 10 }}
                                                    >
                                                        {getCategoryIcon(category)} {category}
                                                    </Tag>
                                                    {items.map((item, idx) => (
                                                        <Tooltip
                                                            key={item.id || idx}
                                                            title={item.calorie ? `${item.calorie} kcal` : null}
                                                        >
                                                            <div style={{
                                                                fontSize: 12,
                                                                padding: '2px 0',
                                                                borderBottom: idx < items.length - 1 ? '1px dashed #f0f0f0' : 'none'
                                                            }}>
                                                                {item.foodName}
                                                            </div>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            ))}

                                            {totalCalories > 0 && (
                                                <div style={{
                                                    marginTop: 8,
                                                    paddingTop: 8,
                                                    borderTop: '1px solid #f0f0f0',
                                                    textAlign: 'center'
                                                }}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        <FireOutlined style={{ color: '#fa8c16' }} /> {totalCalories} kcal
                                                    </Text>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Modal>
    );
};

export default WeeklyMenuModal;