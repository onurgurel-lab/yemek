/**
 * WeeklyMenuModal.jsx - Haftalık Menü Modal
 *
 * Bir haftanın menüsünü öğle/akşam sekmeli olarak görüntüler.
 *
 * @module pages/Yemekhane/components/WeeklyMenuModal
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
    Badge,
    Tooltip
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

const { Text, Title } = Typography;

/**
 * WeeklyMenuModal - Haftalık Menü Modal
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma
 * @param {string} props.startDate - Başlangıç tarihi (YYYY-MM-DD)
 */
const WeeklyMenuModal = ({ visible, onClose, startDate }) => {
    const [loading, setLoading] = useState(false);
    const [weekData, setWeekData] = useState([]);
    const [activeTab, setActiveTab] = useState('lunch');

    // Get week days starting from Monday
    const getWeekDays = useCallback((date) => {
        const days = [];
        const start = dayjs(date).startOf('week').add(1, 'day'); // Monday

        for (let i = 0; i < 7; i++) {
            const currentDate = start.add(i, 'day');
            days.push({
                date: currentDate.format('YYYY-MM-DD'),
                dayName: DAY_NAMES_FULL[i] || currentDate.format('dddd'),
                dayNumber: currentDate.format('D'),
                month: currentDate.format('MMMM'),
                isToday: currentDate.isSame(dayjs(), 'day'),
                isWeekend: i >= 5
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

            // Group by date
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

    // Load data when modal opens
    useEffect(() => {
        if (visible && startDate) {
            loadWeekData();
        }
    }, [visible, startDate, loadWeekData]);

    // Get week range title
    const getWeekRangeTitle = () => {
        if (weekData.length === 0) return 'Haftalık Menü';
        const start = weekData[0];
        const end = weekData[6];
        return `${start.dayNumber} ${start.month} - ${end.dayNumber} ${end.month}`;
    };

    // Render day card
    const renderDayCard = (day, mealType) => {
        const menus = mealType === 'lunch' ? day.lunch : day.dinner;
        const groupedMenu = groupMenuByCategory(menus);
        const categories = Object.keys(groupedMenu);

        return (
            <Card
                key={`${day.date}-${mealType}`}
                size="small"
                className={`weekly-day-card ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{day.dayName}</Text>
                        <Text type="secondary">{day.dayNumber} {day.month}</Text>
                    </div>
                }
                extra={day.isToday && <Badge status="success" text="Bugün" />}
                style={{ height: '100%' }}
            >
                {menus.length === 0 ? (
                    <Empty
                        description="Menü yok"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <div className="weekly-menu-content">
                        {categories.map(category => (
                            <div key={category} style={{ marginBottom: 12 }}>
                                <Text type="secondary" strong style={{ fontSize: 11 }}>
                                    {getCategoryIcon(category)} {category}
                                </Text>
                                <div style={{ marginTop: 4 }}>
                                    {groupedMenu[category].map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '4px 0',
                                            borderBottom: '1px dashed #f0f0f0'
                                        }}>
                                            <Text style={{ fontSize: 12 }}>{item.foodName}</Text>
                                            <Tooltip title="Kalori">
                                                <Tag
                                                    color="orange"
                                                    style={{ fontSize: 10, marginLeft: 4 }}
                                                >
                                                    {item.calorie || 0}
                                                </Tag>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        );
    };

    // Tab items
    const tabItems = [
        {
            key: 'lunch',
            label: '🍲 Öğle Yemeği',
            children: (
                <Row gutter={[16, 16]}>
                    {weekData.map(day => (
                        <Col key={day.date} xs={24} sm={12} md={8} lg={8} xl={6}>
                            {renderDayCard(day, 'lunch')}
                        </Col>
                    ))}
                </Row>
            )
        },
        {
            key: 'dinner',
            label: '🍽️ Akşam Yemeği',
            children: (
                <Row gutter={[16, 16]}>
                    {weekData.map(day => (
                        <Col key={day.date} xs={24} sm={12} md={8} lg={8} xl={6}>
                            {renderDayCard(day, 'dinner')}
                        </Col>
                    ))}
                </Row>
            )
        }
    ];

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CalendarOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Haftalık Menü</Title>
                        <Text type="secondary">{getWeekRangeTitle()}</Text>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            centered
            destroyOnClose
            styles={{
                body: { maxHeight: '70vh', overflowY: 'auto' }
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
                .weekly-day-card {
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                .weekly-day-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .weekly-day-card.today {
                    border: 2px solid #52c41a;
                }
                .weekly-day-card.weekend .ant-card-head {
                    background: #fff1f0;
                }
                .weekly-menu-content {
                    max-height: 300px;
                    overflow-y: auto;
                }
            `}</style>
        </Modal>
    );
};

export default WeeklyMenuModal;