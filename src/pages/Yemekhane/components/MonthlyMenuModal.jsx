/**
 * MonthlyMenuModal.jsx - Aylık Menü Modal
 *
 * Bir ayın menüsünü takvim görünümünde öğle/akşam sekmeli olarak görüntüler.
 *
 * @module pages/Yemekhane/components/MonthlyMenuModal
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
    Badge,
    Tooltip,
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
    MONTH_NAMES,
    getCategoryColor,
    getCategoryIcon
} from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;

/**
 * MonthlyMenuModal - Aylık Menü Modal
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma
 * @param {number} props.year - Yıl
 * @param {number} props.month - Ay (0-11)
 */
const MonthlyMenuModal = ({ visible, onClose, year, month }) => {
    const [loading, setLoading] = useState(false);
    const [monthData, setMonthData] = useState([]);
    const [activeTab, setActiveTab] = useState('lunch');

    // Get month days with padding for calendar view
    const getMonthDays = useCallback((year, month) => {
        const days = [];
        const firstDay = dayjs(new Date(year, month, 1));
        const lastDay = dayjs(new Date(year, month + 1, 0));

        // Get Monday offset
        const dayOfWeek = firstDay.day();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Add previous month's days
        for (let i = mondayOffset - 1; i >= 0; i--) {
            const prevDate = firstDay.subtract(i + 1, 'day');
            days.push({
                date: prevDate.format('YYYY-MM-DD'),
                dayNumber: prevDate.date(),
                isCurrentMonth: false,
                isToday: prevDate.isSame(dayjs(), 'day')
            });
        }

        // Add current month's days
        for (let day = 1; day <= lastDay.date(); day++) {
            const currentDate = dayjs(new Date(year, month, day));
            days.push({
                date: currentDate.format('YYYY-MM-DD'),
                dayNumber: day,
                isCurrentMonth: true,
                isToday: currentDate.isSame(dayjs(), 'day'),
                isWeekend: currentDate.day() === 0 || currentDate.day() === 6
            });
        }

        // Add next month's days to complete the grid
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const nextDate = lastDay.add(day, 'day');
            days.push({
                date: nextDate.format('YYYY-MM-DD'),
                dayNumber: day,
                isCurrentMonth: false,
                isToday: nextDate.isSame(dayjs(), 'day')
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

        // Sort by category order
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

            // Get all month days
            const monthDays = getMonthDays(year, month);

            // Group menus by date
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

    // Load data when modal opens
    useEffect(() => {
        if (visible && year !== undefined && month !== undefined) {
            loadMonthData();
        }
    }, [visible, year, month, loadMonthData]);

    // Render day cell content
    const renderDayContent = (day, mealType) => {
        const menus = mealType === 'lunch' ? day.lunch : day.dinner;
        const groupedMenu = groupMenuByCategory(menus);
        const categories = Object.keys(groupedMenu);

        if (!day.isCurrentMonth) {
            return <div className="other-month-day">-</div>;
        }

        if (menus.length === 0) {
            return <div className="no-menu-day">Menü yok</div>;
        }

        const totalCalories = menus.reduce((sum, m) => sum + (m.calorie || 0), 0);

        // Popover content for detailed view
        const popoverContent = (
            <div style={{ maxWidth: 300 }}>
                {categories.map(category => (
                    <div key={category} style={{ marginBottom: 8 }}>
                        <Text type="secondary" strong>
                            {getCategoryIcon(category)} {category}
                        </Text>
                        <div>
                            {groupedMenu[category].map(item => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '2px 0'
                                }}>
                                    <Text style={{ fontSize: 12 }}>{item.foodName}</Text>
                                    <Tag color="orange" style={{ fontSize: 10 }}>
                                        {item.calorie || 0} kcal
                                    </Tag>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );

        return (
            <Popover
                content={popoverContent}
                title={`${day.dayNumber} - ${mealType === 'lunch' ? 'Öğle' : 'Akşam'}`}
                trigger="hover"
                placement="right"
            >
                <div className="monthly-menu-content" style={{ cursor: 'pointer' }}>
                    {categories.slice(0, 4).map(category => (
                        <div key={category} className="monthly-category-item">
                            <Text
                                style={{ fontSize: 10 }}
                                type="secondary"
                            >
                                {getCategoryIcon(category)}
                            </Text>
                            <div style={{ fontSize: 10, marginLeft: 4 }}>
                                {groupedMenu[category].slice(0, 2).map(item => (
                                    <div key={item.id} style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 80
                                    }}>
                                        {item.foodName}
                                    </div>
                                ))}
                                {groupedMenu[category].length > 2 && (
                                    <Text type="secondary" style={{ fontSize: 9 }}>
                                        +{groupedMenu[category].length - 2}
                                    </Text>
                                )}
                            </div>
                        </div>
                    ))}
                    {categories.length > 4 && (
                        <Text type="secondary" style={{ fontSize: 9 }}>
                            +{categories.length - 4} kategori
                        </Text>
                    )}
                    <div style={{ marginTop: 4 }}>
                        <Tag color="orange" style={{ fontSize: 9 }}>
                            <FireOutlined /> {totalCalories} kcal
                        </Tag>
                    </div>
                </div>
            </Popover>
        );
    };

    // Render calendar grid
    const renderCalendarGrid = (mealType) => {
        const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        return (
            <div className="monthly-calendar-grid">
                {/* Weekday headers */}
                <div className="monthly-weekdays">
                    {weekDays.map(day => (
                        <div key={day} className="monthly-weekday-header">
                            <Text strong>{day}</Text>
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="monthly-days-grid">
                    {monthData.map((day, index) => (
                        <div
                            key={index}
                            className={`monthly-day-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                        >
                            <div className="monthly-day-header">
                                <Badge
                                    count={day.isToday ? 'Bugün' : 0}
                                    style={{ fontSize: 9 }}
                                >
                                    <Text
                                        strong={day.isCurrentMonth}
                                        type={day.isCurrentMonth ? 'default' : 'secondary'}
                                    >
                                        {day.dayNumber}
                                    </Text>
                                </Badge>
                            </div>
                            <div className="monthly-day-content">
                                {renderDayContent(day, mealType)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Tab items
    const tabItems = [
        {
            key: 'lunch',
            label: '🍲 Öğle Yemeği',
            children: renderCalendarGrid('lunch')
        },
        {
            key: 'dinner',
            label: '🍽️ Akşam Yemeği',
            children: renderCalendarGrid('dinner')
        }
    ];

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CalendarOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Aylık Menü</Title>
                        <Text type="secondary">
                            {MONTH_NAMES[month]} {year}
                        </Text>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1400}
            centered
            destroyOnClose
            styles={{
                body: { maxHeight: '80vh', overflowY: 'auto' }
            }}
        >
            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                />
            </Spin>

            <style>{`
                .monthly-calendar-grid {
                    border: 1px solid #f0f0f0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .monthly-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .monthly-weekday-header {
                    padding: 12px;
                    text-align: center;
                }
                
                .monthly-days-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                }
                
                .monthly-day-cell {
                    min-height: 120px;
                    border-right: 1px solid #f0f0f0;
                    border-bottom: 1px solid #f0f0f0;
                    padding: 8px;
                    transition: all 0.2s;
                }
                
                .monthly-day-cell:nth-child(7n) {
                    border-right: none;
                }
                
                .monthly-day-cell:hover {
                    background: #f5f5f5;
                }
                
                .monthly-day-cell.today {
                    background: #e6f7ff;
                    border: 2px solid #1890ff;
                }
                
                .monthly-day-cell.other-month {
                    background: #fafafa;
                }
                
                .monthly-day-cell.weekend:not(.other-month) .monthly-day-header {
                    color: #ff4d4f;
                }
                
                .monthly-day-header {
                    margin-bottom: 8px;
                }
                
                .monthly-day-content {
                    font-size: 11px;
                }
                
                .other-month-day,
                .no-menu-day {
                    color: #bfbfbf;
                    font-style: italic;
                    text-align: center;
                    padding: 20px 0;
                }
                
                .monthly-menu-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .monthly-category-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 4px;
                }
            `}</style>
        </Modal>
    );
};

export default MonthlyMenuModal;