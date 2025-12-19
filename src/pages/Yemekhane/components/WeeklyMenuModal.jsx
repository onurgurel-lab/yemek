/**
 * WeeklyMenuModal.jsx - Haftalık Menü Modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Tabs,
    Card,
    Tag,
    Empty,
    Spin,
    Typography,
    Row,
    Col,
    Badge
} from 'antd';
import {
    CalendarOutlined,
    FireOutlined
} from '@ant-design/icons';
import * as mealMenuService from '@/services/mealMenuService';
import {
    MEAL_TIMES,
    CATEGORY_ORDER,
    DAY_NAMES_FULL,
    getCategoryColor,
    getCategoryIcon
} from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text } = Typography;

const WeeklyMenuModal = ({ visible, onClose, startDate }) => {
    const [loading, setLoading] = useState(false);
    const [weekData, setWeekData] = useState([]);
    const [activeTab, setActiveTab] = useState('lunch');

    // Get week days starting from Monday
    const getWeekDays = useCallback((date) => {
        const days = [];
        const targetDate = dayjs(date);

        // dayjs.day(): 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const dayOfWeek = targetDate.day();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = targetDate.subtract(daysToMonday, 'day');

        for (let i = 0; i < 7; i++) {
            const currentDate = monday.add(i, 'day');
            const currentDayOfWeek = currentDate.day();

            days.push({
                date: currentDate.format('YYYY-MM-DD'),
                dayName: DAY_NAMES_FULL[i],
                dayNumber: currentDate.format('D'),
                month: currentDate.format('MMMM'),
                isToday: currentDate.isSame(dayjs(), 'day'),
                isWeekend: currentDayOfWeek === 0 || currentDayOfWeek === 6
            });
        }
        return days;
    }, []);

    // Group menu by category
    const groupMenuByCategory = useCallback((menu) => {
        if (!Array.isArray(menu)) return {};

        const grouped = menu.reduce((acc, item) => {
            const category = item.category || 'Diğer';
            const normalizedCategory = category.toLowerCase().trim();
            const matchedCategory = CATEGORY_ORDER.find(
                cat => cat.toLowerCase() === normalizedCategory
            ) || 'Diğer';

            if (!acc[matchedCategory]) {
                acc[matchedCategory] = [];
            }
            acc[matchedCategory].push(item);
            return acc;
        }, {});

        const sortedGrouped = {};
        CATEGORY_ORDER.forEach(category => {
            if (grouped[category]) {
                sortedGrouped[category] = grouped[category];
            }
        });

        Object.keys(grouped).forEach(category => {
            if (!sortedGrouped[category]) {
                sortedGrouped[category] = grouped[category];
            }
        });

        return sortedGrouped;
    }, []);

    // Load week data
    const loadWeekData = useCallback(async () => {
        if (!startDate) return;

        setLoading(true);
        try {
            const weekDays = getWeekDays(startDate);
            const startDateStr = weekDays[0].date;
            const endDateStr = weekDays[6].date;

            const response = await mealMenuService.getMenusByDateRange(startDateStr, endDateStr);
            const menus = response?.data || response || [];

            const weekDataWithMenus = weekDays.map(day => {
                const dayMenus = menus.filter(menu => {
                    const menuDate = dayjs(menu.menuDate).format('YYYY-MM-DD');
                    return menuDate === day.date;
                });

                return {
                    ...day,
                    lunch: dayMenus.filter(m => m.mealTime === MEAL_TIMES.LUNCH),
                    dinner: dayMenus.filter(m => m.mealTime === MEAL_TIMES.DINNER)
                };
            });

            setWeekData(weekDataWithMenus);
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

    const getWeekRangeTitle = () => {
        if (weekData.length === 0) return 'Haftalık Menü';
        const start = weekData[0];
        const end = weekData[6];
        return `${start.dayNumber} ${start.month} - ${end.dayNumber} ${end.month}`;
    };

    const renderDayCard = (day, mealType) => {
        const menus = mealType === 'lunch' ? day.lunch : day.dinner;
        const groupedMenu = groupMenuByCategory(menus);
        const categories = Object.keys(groupedMenu);
        const totalCalories = menus.reduce((sum, item) => sum + (item.calories || item.calorie || 0), 0);

        return (
            <Card
                key={`${day.date}-${mealType}`}
                size="small"
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{day.dayName}</Text>
                        <Text type="secondary">{day.dayNumber} {day.month}</Text>
                    </div>
                }
                extra={day.isToday && <Badge status="success" text="Bugün" />}
                style={{
                    height: '100%',
                    borderColor: day.isToday ? '#1890ff' : undefined,
                    backgroundColor: day.isWeekend ? '#fafafa' : undefined
                }}
            >
                {menus.length === 0 ? (
                    <Empty
                        description="Menü yok"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ margin: '20px 0' }}
                    />
                ) : (
                    <div>
                        {categories.map(category => (
                            <div key={category} style={{ marginBottom: 8 }}>
                                <Tag color={getCategoryColor(category)} style={{ marginBottom: 4 }}>
                                    {getCategoryIcon(category)} {category}
                                </Tag>
                                <div style={{ paddingLeft: 8 }}>
                                    {groupedMenu[category].map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            style={{
                                                fontSize: 12,
                                                padding: '2px 0',
                                                borderBottom: idx < groupedMenu[category].length - 1 ? '1px dashed #f0f0f0' : 'none'
                                            }}
                                        >
                                            <Text>{item.foodName}</Text>
                                            {(item.calories || item.calorie) > 0 && (
                                                <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                                    {item.calories || item.calorie} kcal
                                                </Text>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {totalCalories > 0 && (
                            <div style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: '1px solid #f0f0f0',
                                textAlign: 'right'
                            }}>
                                <Tag icon={<FireOutlined />} color="orange">
                                    Toplam: {totalCalories} kcal
                                </Tag>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        );
    };

    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle Yemeği' },
        { key: 'dinner', label: '🌙 Akşam Yemeği' }
    ];

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined />
                    <span>Haftalık Menü</span>
                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
                        ({getWeekRangeTitle()})
                    </Text>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />

                <Row gutter={[12, 12]}>
                    {weekData.map(day => (
                        <Col key={day.date} xs={24} sm={12} md={8} lg={24 / 7}>
                            {renderDayCard(day, activeTab)}
                        </Col>
                    ))}
                </Row>
            </Spin>
        </Modal>
    );
};

export default WeeklyMenuModal;