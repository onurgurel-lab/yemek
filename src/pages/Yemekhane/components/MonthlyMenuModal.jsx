/**
 * MonthlyMenuModal.jsx - Aylık Menü Modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Tabs,
    Tag,
    Spin,
    Typography,
    Popover
} from 'antd';
import {
    CalendarOutlined,
    FireOutlined
} from '@ant-design/icons';
import * as mealMenuService from '@/services/mealMenuService';
import {
    MEAL_TIMES,
    CATEGORY_ORDER,
    DAY_NAMES,
    MONTH_NAMES,
    getCategoryColor,
    getCategoryIcon
} from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text } = Typography;

const MonthlyMenuModal = ({ visible, onClose, year, month }) => {
    const [loading, setLoading] = useState(false);
    const [monthData, setMonthData] = useState([]);
    const [activeTab, setActiveTab] = useState('lunch');

    // Get month days with padding for calendar view
    const getMonthDays = useCallback((year, month) => {
        const days = [];
        const firstDay = dayjs(new Date(year, month, 1));
        const lastDay = dayjs(new Date(year, month + 1, 0));

        // dayjs.day(): 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const dayOfWeek = firstDay.day();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Add previous month's days
        for (let i = mondayOffset - 1; i >= 0; i--) {
            const prevDate = firstDay.subtract(i + 1, 'day');
            days.push({
                date: prevDate.format('YYYY-MM-DD'),
                dayNumber: prevDate.date(),
                isCurrentMonth: false,
                isToday: prevDate.isSame(dayjs(), 'day'),
                isWeekend: prevDate.day() === 0 || prevDate.day() === 6
            });
        }

        // Add current month's days
        for (let day = 1; day <= lastDay.date(); day++) {
            const currentDate = dayjs(new Date(year, month, day));
            const currentDayOfWeek = currentDate.day();
            days.push({
                date: currentDate.format('YYYY-MM-DD'),
                dayNumber: day,
                isCurrentMonth: true,
                isToday: currentDate.isSame(dayjs(), 'day'),
                isWeekend: currentDayOfWeek === 0 || currentDayOfWeek === 6
            });
        }

        // Add next month's days to complete the grid (42 cells = 6 weeks)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const nextDate = lastDay.add(day, 'day');
            days.push({
                date: nextDate.format('YYYY-MM-DD'),
                dayNumber: day,
                isCurrentMonth: false,
                isToday: nextDate.isSame(dayjs(), 'day'),
                isWeekend: nextDate.day() === 0 || nextDate.day() === 6
            });
        }

        return days;
    }, []);

    // Group menu by category
    const groupMenuByCategory = useCallback((menu) => {
        if (!Array.isArray(menu) || menu.length === 0) return {};

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

    // Load month data
    const loadMonthData = useCallback(async () => {
        if (year === undefined || month === undefined) return;

        setLoading(true);
        try {
            const startDate = dayjs(new Date(year, month, 1)).format('YYYY-MM-DD');
            const endDate = dayjs(new Date(year, month + 1, 0)).format('YYYY-MM-DD');

            const response = await mealMenuService.getMenusByDateRange(startDate, endDate);
            const menus = response?.data || response || [];

            const monthDays = getMonthDays(year, month);

            const monthDataWithMenus = monthDays.map(day => {
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

            setMonthData(monthDataWithMenus);
        } catch (error) {
            console.error('Aylık menü yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [year, month, getMonthDays]);

    useEffect(() => {
        if (visible && year !== undefined && month !== undefined) {
            loadMonthData();
        }
    }, [visible, year, month, loadMonthData]);

    // Render day cell content
    const renderDayContent = (day, mealType) => {
        const menus = mealType === 'lunch' ? day.lunch : day.dinner;

        if (!day.isCurrentMonth) {
            return (
                <div style={{
                    color: '#d9d9d9',
                    textAlign: 'center',
                    padding: 4
                }}>
                    {day.dayNumber}
                </div>
            );
        }

        if (!menus || menus.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: 4 }}>
                    <div style={{ fontWeight: day.isToday ? 'bold' : 'normal' }}>
                        {day.dayNumber}
                    </div>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        Menü yok
                    </Text>
                </div>
            );
        }

        const groupedMenu = groupMenuByCategory(menus);
        const categories = Object.keys(groupedMenu);
        const totalCalories = menus.reduce((sum, item) => sum + (item.calories || item.calorie || 0), 0);

        const popoverContent = (
            <div style={{ maxWidth: 250 }}>
                {categories.map(category => (
                    <div key={category} style={{ marginBottom: 8 }}>
                        <Tag color={getCategoryColor(category)} size="small">
                            {getCategoryIcon(category)} {category}
                        </Tag>
                        <div style={{ paddingLeft: 8, marginTop: 4 }}>
                            {groupedMenu[category].map((item, idx) => (
                                <div key={item.id || idx} style={{ fontSize: 12, padding: '2px 0' }}>
                                    {item.foodName}
                                    {(item.calories || item.calorie) > 0 && (
                                        <Text type="secondary" style={{ marginLeft: 4, fontSize: 10 }}>
                                            ({item.calories || item.calorie} kcal)
                                        </Text>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {totalCalories > 0 && (
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                        <Tag icon={<FireOutlined />} color="orange">
                            {totalCalories} kcal
                        </Tag>
                    </div>
                )}
            </div>
        );

        return (
            <Popover
                content={popoverContent}
                title={`${day.dayNumber} ${MONTH_NAMES[month]}`}
                trigger="hover"
            >
                <div style={{
                    textAlign: 'center',
                    padding: 4,
                    cursor: 'pointer',
                    minHeight: 60
                }}>
                    <div style={{
                        fontWeight: day.isToday ? 'bold' : 'normal',
                        color: day.isToday ? '#1890ff' : undefined
                    }}>
                        {day.dayNumber}
                    </div>
                    <div style={{ marginTop: 4 }}>
                        {categories.slice(0, 2).map(category => (
                            <div key={category} style={{
                                fontSize: 9,
                                color: getCategoryColor(category),
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 80
                            }}>
                                {groupedMenu[category][0]?.foodName}
                            </div>
                        ))}
                        {categories.length > 2 && (
                            <Text type="secondary" style={{ fontSize: 9 }}>
                                +{categories.length - 2}
                            </Text>
                        )}
                    </div>
                    {totalCalories > 0 && (
                        <Tag color="orange" style={{ fontSize: 9, marginTop: 2 }}>
                            <FireOutlined /> {totalCalories}
                        </Tag>
                    )}
                </div>
            </Popover>
        );
    };

    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle Yemeği' },
        { key: 'dinner', label: '🌙 Akşam Yemeği' }
    ];

    const getModalTitle = () => {
        if (year === undefined || month === undefined) return 'Aylık Menü';
        return `${MONTH_NAMES[month]} ${year}`;
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined />
                    <span>Aylık Menü</span>
                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
                        ({getModalTitle()})
                    </Text>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />

                {/* Weekday headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                    marginBottom: 8
                }}>
                    {DAY_NAMES.map((day, idx) => (
                        <div
                            key={day}
                            style={{
                                textAlign: 'center',
                                fontWeight: 'bold',
                                padding: 8,
                                backgroundColor: '#fafafa',
                                borderRadius: 4,
                                color: idx >= 5 ? '#fa8c16' : '#000'
                            }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4
                }}>
                    {monthData.map((day, index) => (
                        <div
                            key={day.date || index}
                            style={{
                                border: day.isToday
                                    ? '2px solid #1890ff'
                                    : '1px solid #f0f0f0',
                                borderRadius: 4,
                                minHeight: 80,
                                backgroundColor: !day.isCurrentMonth
                                    ? '#fafafa'
                                    : day.isWeekend
                                        ? '#fffbe6'
                                        : '#fff'
                            }}
                        >
                            {renderDayContent(day, activeTab)}
                        </div>
                    ))}
                </div>
            </Spin>
        </Modal>
    );
};

export default MonthlyMenuModal;