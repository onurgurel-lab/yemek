import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Card, Tag, Empty, Spin, Typography, Tooltip, Badge } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import mealMenuService from '@/services/mealMenuService';
import { MEAL_TIMES, DAY_NAMES, MONTH_NAMES, getCategoryColor } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text } = Typography;

const MonthlyMenuModal = ({ visible, onClose, month }) => {
    const [loading, setLoading] = useState(false);
    const [monthData, setMonthData] = useState({});
    const [activeTab, setActiveTab] = useState('lunch');
    const [currentMonth, setCurrentMonth] = useState(month || dayjs().format('YYYY-MM'));

    // Generate calendar grid (42 days for 6 weeks)
    const generateCalendarDays = useCallback(() => {
        const days = [];
        const monthStart = dayjs(currentMonth + '-01');
        const monthEnd = monthStart.endOf('month');

        // Start from Monday of the week containing the 1st
        let startDay = monthStart.startOf('week');
        if (monthStart.day() === 0) {
            startDay = startDay.subtract(6, 'day');
        } else {
            startDay = startDay.add(1, 'day');
        }

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const date = startDay.add(i, 'day');
            days.push({
                date: date.format('YYYY-MM-DD'),
                dayNumber: date.format('D'),
                isCurrentMonth: date.month() === monthStart.month(),
                isToday: date.isSame(dayjs(), 'day'),
                isWeekend: date.day() === 0 || date.day() === 6
            });
        }

        return days;
    }, [currentMonth]);

    // Load month data
    const loadMonthData = useCallback(async () => {
        if (!currentMonth) return;

        setLoading(true);
        try {
            const calendarDays = generateCalendarDays();
            const startDate = calendarDays[0].date;
            const endDate = calendarDays[calendarDays.length - 1].date;

            const response = await mealMenuService.getMenusByDateRange(startDate, endDate);
            const menus = response?.data || [];

            // Group by date
            const grouped = {};
            calendarDays.forEach(day => {
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

            setMonthData(grouped);
        } catch (error) {
            console.error('Aylık menü yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, generateCalendarDays]);

    useEffect(() => {
        if (visible) {
            setCurrentMonth(month || dayjs().format('YYYY-MM'));
        }
    }, [visible, month]);

    useEffect(() => {
        if (visible && currentMonth) {
            loadMonthData();
        }
    }, [visible, currentMonth, loadMonthData]);

    // Navigation
    const goToPrevMonth = () => {
        setCurrentMonth(dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'));
    };

    const goToNextMonth = () => {
        setCurrentMonth(dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM'));
    };

    // Get month title
    const getMonthTitle = () => {
        const monthDate = dayjs(currentMonth + '-01');
        const monthIndex = monthDate.month();
        const year = monthDate.year();
        return `${MONTH_NAMES[monthIndex]} ${year}`;
    };

    // Get category summary for a day
    const getCategorySummary = (items) => {
        const categories = {};
        items.forEach(item => {
            const cat = item.category || 'Diğer';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        return Object.entries(categories);
    };

    // Build tooltip content
    const buildTooltipContent = (items) => {
        if (items.length === 0) return null;

        return (
            <div style={{ maxWidth: 200 }}>
                {items.map((item, idx) => (
                    <div key={item.id || idx} style={{ padding: '2px 0' }}>
                        <Tag color={getCategoryColor(item.category)} style={{ fontSize: 10, marginRight: 4 }}>
                            {item.category}
                        </Tag>
                        <span style={{ fontSize: 11 }}>{item.foodName}</span>
                    </div>
                ))}
            </div>
        );
    };

    const calendarDays = generateCalendarDays();
    const mealKey = activeTab === 'lunch' ? 'lunch' : 'dinner';

    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle' },
        { key: 'dinner', label: '🌙 Akşam' }
    ];

    // Render day cell
    const renderDayCell = (day) => {
        const dayMenus = monthData[day.date]?.[mealKey] || [];
        const categorySummary = getCategorySummary(dayMenus);
        const hasMenu = dayMenus.length > 0;

        return (
            <Tooltip
                title={buildTooltipContent(dayMenus)}
                placement="top"
                overlayStyle={{ maxWidth: 250 }}
            >
                <div
                    style={{
                        width: '100%',
                        height: 80,
                        padding: 4,
                        border: day.isToday ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        borderRadius: 4,
                        backgroundColor: !day.isCurrentMonth
                            ? '#fafafa'
                            : day.isToday
                                ? '#e6f7ff'
                                : day.isWeekend
                                    ? '#fffbe6'
                                    : '#fff',
                        opacity: day.isCurrentMonth ? 1 : 0.5,
                        cursor: hasMenu ? 'pointer' : 'default',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4
                    }}>
                        <Text
                            strong={day.isToday}
                            style={{
                                fontSize: 12,
                                color: day.isToday ? '#1890ff' : (day.isCurrentMonth ? '#000' : '#bfbfbf')
                            }}
                        >
                            {day.dayNumber}
                        </Text>
                        {hasMenu && (
                            <Badge
                                count={dayMenus.length}
                                size="small"
                                style={{ backgroundColor: '#52c41a' }}
                            />
                        )}
                    </div>

                    <div style={{ overflow: 'hidden', height: 50 }}>
                        {!hasMenu && day.isCurrentMonth && (
                            <Text type="secondary" style={{ fontSize: 10 }}>-</Text>
                        )}
                        {categorySummary.slice(0, 3).map(([category, count], idx) => (
                            <div key={category} style={{ marginBottom: 2 }}>
                                <Tag
                                    color={getCategoryColor(category)}
                                    style={{
                                        fontSize: 9,
                                        padding: '0 4px',
                                        lineHeight: '16px',
                                        marginRight: 0
                                    }}
                                >
                                    {category.substring(0, 6)}{category.length > 6 ? '..' : ''} ({count})
                                </Tag>
                            </div>
                        ))}
                        {categorySummary.length > 3 && (
                            <Text type="secondary" style={{ fontSize: 9 }}>
                                +{categorySummary.length - 3} kategori
                            </Text>
                        )}
                    </div>
                </div>
            </Tooltip>
        );
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Aylık Menü
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <LeftOutlined
                            onClick={goToPrevMonth}
                            style={{ cursor: 'pointer', fontSize: 16 }}
                        />
                        <span style={{ minWidth: 150, textAlign: 'center', fontWeight: 'bold' }}>
              {getMonthTitle()}
            </span>
                        <RightOutlined
                            onClick={goToNextMonth}
                            style={{ cursor: 'pointer', fontSize: 16 }}
                        />
                    </div>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            bodyStyle={{ padding: '12px 24px' }}
            destroyOnClose
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ marginBottom: 8 }}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div>
                    {/* Day headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 4,
                        marginBottom: 8
                    }}>
                        {DAY_NAMES.map((dayName, idx) => (
                            <div
                                key={dayName}
                                style={{
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    padding: 4,
                                    backgroundColor: idx === 5 || idx === 6 ? '#fff7e6' : '#fafafa',
                                    borderRadius: 4
                                }}
                            >
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 4
                    }}>
                        {calendarDays.map((day) => (
                            <div key={day.date}>
                                {renderDayCell(day)}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#fafafa',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        flexWrap: 'wrap'
                    }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
              <span style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  backgroundColor: '#e6f7ff',
                  border: '2px solid #1890ff',
                  marginRight: 4,
                  verticalAlign: 'middle'
              }}></span>
                            Bugün
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
              <span style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  backgroundColor: '#fffbe6',
                  border: '1px solid #f0f0f0',
                  marginRight: 4,
                  verticalAlign: 'middle'
              }}></span>
                            Hafta sonu
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <Badge
                                count={3}
                                size="small"
                                style={{ backgroundColor: '#52c41a', marginRight: 4 }}
                            />
                            Yemek sayısı
                        </Text>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default MonthlyMenuModal;