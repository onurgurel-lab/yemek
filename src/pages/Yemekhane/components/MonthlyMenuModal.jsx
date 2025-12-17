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

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentMonth(dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'));
    };

    const goToNextMonth = () => {
        setCurrentMonth(dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM'));
    };

    // Render day cell
    const renderDayCell = (day, mealType) => {
        const items = monthData[day.date]?.[mealType] || [];
        const hasMenu = items.length > 0;

        return (
            <Tooltip
                title={
                    hasMenu ? (
                        <div>
                            {items.map((item, idx) => (
                                <div key={idx}>{item.foodName}</div>
                            ))}
                        </div>
                    ) : 'Menü yok'
                }
            >
                <div
                    style={{
                        padding: 4,
                        minHeight: 60,
                        backgroundColor: !day.isCurrentMonth
                            ? '#fafafa'
                            : day.isToday
                                ? '#e6f7ff'
                                : day.isWeekend
                                    ? '#f9f9f9'
                                    : 'white',
                        border: day.isToday ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        borderRadius: 4,
                        opacity: day.isCurrentMonth ? 1 : 0.5
                    }}
                >
                    <div style={{ fontWeight: day.isToday ? 'bold' : 'normal', marginBottom: 4 }}>
                        {day.dayNumber}
                    </div>
                    {hasMenu ? (
                        <div>
                            {items.slice(0, 2).map((item, idx) => (
                                <Tag
                                    key={idx}
                                    color={getCategoryColor(item.category)}
                                    style={{ fontSize: 10, marginBottom: 2, display: 'block' }}
                                >
                                    {item.foodName.length > 10
                                        ? item.foodName.substring(0, 10) + '...'
                                        : item.foodName}
                                </Tag>
                            ))}
                            {items.length > 2 && (
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                    +{items.length - 2} daha
                                </Text>
                            )}
                        </div>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description=""
                            style={{ margin: 0 }}
                            imageStyle={{ height: 20 }}
                        />
                    )}
                </div>
            </Tooltip>
        );
    };

    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < 6; i++) {
        weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
    }

    const monthName = MONTH_NAMES[dayjs(currentMonth + '-01').month()];
    const year = dayjs(currentMonth + '-01').year();

    const renderCalendar = (mealType) => (
        <Spin spinning={loading}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                    <tr>
                        {DAY_NAMES.map((dayName, idx) => (
                            <th
                                key={idx}
                                style={{
                                    padding: 8,
                                    textAlign: 'center',
                                    backgroundColor: '#fafafa',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                            >
                                {dayName}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {weeks.map((week, weekIdx) => (
                        <tr key={weekIdx}>
                            {week.map((day, dayIdx) => (
                                <td key={dayIdx} style={{ padding: 2, verticalAlign: 'top' }}>
                                    {renderDayCell(day, mealType)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Spin>
    );

    const tabItems = [
        {
            key: 'lunch',
            label: 'Öğle Yemeği',
            children: renderCalendar('lunch')
        },
        {
            key: 'dinner',
            label: 'Akşam Yemeği',
            children: renderCalendar('dinner')
        }
    ];

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                        <CalendarOutlined /> Aylık Menü Takvimi
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <LeftOutlined
                            onClick={goToPreviousMonth}
                            style={{ cursor: 'pointer', fontSize: 16 }}
                        />
                        <span style={{ fontWeight: 'bold', minWidth: 150, textAlign: 'center' }}>
                            {monthName} {year}
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

export default MonthlyMenuModal;