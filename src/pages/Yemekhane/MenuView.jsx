import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Tabs, Input, Row, Col, Badge, Tag, Empty, Spin, Alert, Button, Typography, Space, Tooltip, Statistic } from 'antd';
import { SearchOutlined, CalendarOutlined, FireOutlined, LeftOutlined, RightOutlined, StarOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import {
    fetchMenuByDate,
    fetchTodayMenu,
    searchFood,
    setSelectedDate,
    setCurrentMonth,
    setActiveTab,
    setSearchTerm,
    clearSearchResults,
    toggleWeeklyPopup,
    toggleMonthlyPopup,
    toggleDayEvaluationPopup,
    selectMenuData,
    selectSelectedDate,
    selectCurrentMonth,
    selectActiveTab,
    selectSearchTerm,
    selectSearchResults,
    selectShowSearchResults,
    selectShowWeeklyPopup,
    selectShowMonthlyPopup,
    selectShowDayEvaluationPopup,
    selectLoading,
    selectSearchLoading
} from '@/store/slices/yemekhaneSlice';
import {
    MEAL_TIMES,
    MEAL_CATEGORIES,
    DAY_NAMES,
    MONTH_NAMES,
    getCategoryColor,
    getCategoryIcon,
    isToday as checkIsToday,
    getDefaultMealTab
} from '@/constants/mealMenuApi';
import { dayPointService } from '@/services/evaluationService';
import MenuRating from './components/MenuRating';
import DayEvaluationModal from './components/DayEvaluationModal';
import WeeklyMenuModal from './components/WeeklyMenuModal';
import MonthlyMenuModal from './components/MonthlyMenuModal';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;
const { Search } = Input;

const MenuView = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();

    // Ref to track initial mount
    const isInitialMount = useRef(true);

    // Redux state
    const menuData = useSelector(selectMenuData);
    const selectedDate = useSelector(selectSelectedDate);
    const currentMonth = useSelector(selectCurrentMonth);
    const activeTab = useSelector(selectActiveTab);
    const searchTerm = useSelector(selectSearchTerm);
    const searchResults = useSelector(selectSearchResults);
    const showSearchResults = useSelector(selectShowSearchResults);
    const showWeeklyPopup = useSelector(selectShowWeeklyPopup);
    const showMonthlyPopup = useSelector(selectShowMonthlyPopup);
    const showDayEvaluationPopup = useSelector(selectShowDayEvaluationPopup);
    const loading = useSelector(selectLoading);
    const searchLoading = useSelector(selectSearchLoading);

    // Local state
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);

    // Initialize - ONLY on first mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;

            const today = dayjs().format('YYYY-MM-DD');
            const month = dayjs().format('YYYY-MM');

            dispatch(setSelectedDate(today));
            dispatch(setCurrentMonth(month));
            dispatch(setActiveTab(getDefaultMealTab()));
            dispatch(fetchMenuByDate(today));
        }
    }, []); // Empty dependency - only runs once on mount

    // Check if user has existing evaluation for selected date
    const checkExistingEvaluation = useCallback(async (date) => {
        if (!user?.uId || !date) {
            setHasExistingEvaluation(false);
            return;
        }

        try {
            const response = await dayPointService.getByDate(date);
            const points = response?.data || response || [];
            const userPoint = Array.isArray(points)
                ? points.find(p => p.uId === user.uId)
                : null;
            setHasExistingEvaluation(!!userPoint);
        } catch (error) {
            setHasExistingEvaluation(false);
        }
    }, [user?.uId]);

    // Generate calendar days (42 days for 6 weeks)
    const calendarDays = useMemo(() => {
        const days = [];
        const monthStart = dayjs(currentMonth + '-01');

        // Start from Monday of the week containing the 1st
        let startDay = monthStart.startOf('week');
        if (monthStart.day() === 0) {
            startDay = startDay.subtract(6, 'day');
        } else {
            startDay = startDay.add(1, 'day');
        }

        for (let i = 0; i < 42; i++) {
            const date = startDay.add(i, 'day');
            days.push({
                date: date.format('YYYY-MM-DD'),
                day: date.date(),
                isCurrentMonth: date.month() === monthStart.month(),
                isToday: date.isSame(dayjs(), 'day'),
                isSelected: date.format('YYYY-MM-DD') === selectedDate,
                isWeekend: date.day() === 0 || date.day() === 6
            });
        }

        return days;
    }, [currentMonth, selectedDate]);

    // Filter menu by meal time
    const filteredMenu = useMemo(() => {
        if (!menuData || menuData.length === 0) return [];

        const mealTime = activeTab === 'lunch' ? MEAL_TIMES.LUNCH : MEAL_TIMES.DINNER;
        return menuData.filter(item => item.mealTime === mealTime);
    }, [menuData, activeTab]);

    // Group menu by category
    const groupedMenu = useMemo(() => {
        if (!filteredMenu || filteredMenu.length === 0) return [];

        const grouped = {};
        filteredMenu.forEach(item => {
            const category = item.category || 'Diğer';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });

        // Sort by category order
        const categoryOrder = ['ÇORBA', 'ANA YEMEK', 'SPESYEL SALATA', 'YARDIMCI YEMEK', 'CORNER', 'Diğer'];
        const sortedEntries = Object.entries(grouped).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a[0]);
            const indexB = categoryOrder.indexOf(b[0]);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        return sortedEntries;
    }, [filteredMenu]);

    // Calculate total calories
    const totalCalories = useMemo(() => {
        return filteredMenu.reduce((sum, item) => sum + (item.calorie || 0), 0);
    }, [filteredMenu]);

    // Handle date selection from calendar
    const handleDateSelect = useCallback((date) => {
        if (date !== selectedDate) {
            dispatch(setSelectedDate(date));
            dispatch(fetchMenuByDate(date));
            checkExistingEvaluation(date);
        }
    }, [dispatch, selectedDate, checkExistingEvaluation]);

    // Handle month navigation
    const handlePrevMonth = useCallback(() => {
        const newMonth = dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM');
        dispatch(setCurrentMonth(newMonth));
    }, [dispatch, currentMonth]);

    const handleNextMonth = useCallback(() => {
        const newMonth = dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM');
        dispatch(setCurrentMonth(newMonth));
    }, [dispatch, currentMonth]);

    // Handle search
    const handleSearch = useCallback((value) => {
        dispatch(setSearchTerm(value));
        if (value && value.trim().length >= 2) {
            dispatch(searchFood(value.trim()));
        } else {
            dispatch(clearSearchResults());
        }
    }, [dispatch]);

    // Handle tab change
    const handleTabChange = useCallback((key) => {
        dispatch(setActiveTab(key === 'lunch' ? MEAL_TIMES.LUNCH : MEAL_TIMES.DINNER));
    }, [dispatch]);

    // Open rating modal
    const openRatingModal = useCallback((item) => {
        setSelectedMenuItem(item);
        setShowRatingModal(true);
    }, []);

    // Get current month/year display
    const monthYearDisplay = useMemo(() => {
        const monthIndex = dayjs(currentMonth + '-01').month();
        const year = dayjs(currentMonth + '-01').year();
        return `${MONTH_NAMES[monthIndex]} ${year}`;
    }, [currentMonth]);

    // Render calendar day cell
    const renderDayCell = (day) => {
        const cellClass = `
            p-2 text-center cursor-pointer rounded transition-all
            ${day.isCurrentMonth ? '' : 'opacity-40'}
            ${day.isToday ? 'border-2 border-blue-500' : ''}
            ${day.isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            ${day.isWeekend && !day.isSelected ? 'text-red-500' : ''}
        `;

        return (
            <div
                key={day.date}
                className={cellClass}
                onClick={() => handleDateSelect(day.date)}
            >
                {day.day}
            </div>
        );
    };

    // Render menu item card
    const renderMenuItem = (item) => (
        <Card
            key={item.id}
            size="small"
            style={{ marginBottom: 8 }}
            hoverable
            onClick={() => openRatingModal(item)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Text strong>{item.foodName}</Text>
                    {item.calorie > 0 && (
                        <Tag color="orange">
                            <FireOutlined /> {item.calorie} kcal
                        </Tag>
                    )}
                </Space>
                {item.averageRating > 0 && (
                    <Space>
                        <StarOutlined style={{ color: '#faad14' }} />
                        <Text>{item.averageRating.toFixed(1)}</Text>
                    </Space>
                )}
            </div>
        </Card>
    );

    // Tab items
    const tabItems = [
        {
            key: 'lunch',
            label: 'Öğle Yemeği',
        },
        {
            key: 'dinner',
            label: 'Akşam Yemeği',
        }
    ];

    return (
        <div>
            <Row gutter={[16, 16]}>
                {/* Calendar Section */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    type="text"
                                    icon={<LeftOutlined />}
                                    onClick={handlePrevMonth}
                                />
                                <Text strong>{monthYearDisplay}</Text>
                                <Button
                                    type="text"
                                    icon={<RightOutlined />}
                                    onClick={handleNextMonth}
                                />
                            </div>
                        }
                        extra={
                            <Space>
                                <Tooltip title="Haftalık Görünüm">
                                    <Button
                                        type="text"
                                        icon={<CalendarOutlined />}
                                        onClick={() => dispatch(toggleWeeklyPopup())}
                                    />
                                </Tooltip>
                            </Space>
                        }
                    >
                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                            {DAY_NAMES.map((day, index) => (
                                <div key={index} style={{ textAlign: 'center', fontWeight: 'bold', color: index >= 5 ? '#ff4d4f' : undefined }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                            {calendarDays.map(renderDayCell)}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <Button
                                block
                                onClick={() => handleDateSelect(dayjs().format('YYYY-MM-DD'))}
                            >
                                Bugün
                            </Button>
                            <Button
                                block
                                onClick={() => dispatch(toggleMonthlyPopup())}
                            >
                                Aylık Görünüm
                            </Button>
                        </div>
                    </Card>

                    {/* Search */}
                    <Card style={{ marginTop: 16 }}>
                        <Search
                            placeholder="Yemek ara..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            loading={searchLoading}
                            allowClear
                        />
                        {showSearchResults && searchResults.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary">{searchResults.length} sonuç bulundu</Text>
                                {searchResults.slice(0, 5).map(item => (
                                    <Tag
                                        key={item.id}
                                        style={{ margin: 4, cursor: 'pointer' }}
                                        onClick={() => openRatingModal(item)}
                                    >
                                        {item.foodName}
                                    </Tag>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Menu Section */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <CalendarOutlined />
                                <Text strong>
                                    {dayjs(selectedDate).format('DD MMMM YYYY dddd')}
                                </Text>
                                {checkIsToday(selectedDate) && (
                                    <Badge status="processing" text="Bugün" />
                                )}
                            </Space>
                        }
                        extra={
                            totalCalories > 0 && (
                                <Statistic
                                    value={totalCalories}
                                    suffix="kcal"
                                    valueStyle={{ fontSize: 16 }}
                                />
                            )
                        }
                    >
                        <Tabs
                            activeKey={activeTab === MEAL_TIMES.LUNCH ? 'lunch' : 'dinner'}
                            onChange={handleTabChange}
                            items={tabItems}
                        />

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <Spin size="large" />
                            </div>
                        ) : filteredMenu.length === 0 ? (
                            <Empty description="Bu tarih için menü bulunamadı" />
                        ) : (
                            <>
                                {groupedMenu.map(([category, items]) => (
                                    <div key={category} style={{ marginBottom: 16 }}>
                                        <Tag
                                            color={getCategoryColor(category)}
                                            style={{ marginBottom: 8, padding: '4px 12px' }}
                                        >
                                            {getCategoryIcon(category)} {category}
                                        </Tag>
                                        {items.map(renderMenuItem)}
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Day Evaluation Button */}
                        {selectedDate && (
                            <>
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Button
                                        type={hasExistingEvaluation ? 'default' : 'primary'}
                                        icon={<StarOutlined />}
                                        onClick={() => dispatch(toggleDayEvaluationPopup())}
                                    >
                                        {hasExistingEvaluation ? 'Gün Değerlendirmesini Düzenle' : 'Günü Değerlendir'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            <MenuRating
                menuItem={selectedMenuItem}
                visible={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onUpdate={() => dispatch(fetchMenuByDate(selectedDate))}
            />

            <DayEvaluationModal
                visible={showDayEvaluationPopup}
                onClose={() => dispatch(toggleDayEvaluationPopup())}
                date={selectedDate}
                onUpdate={() => checkExistingEvaluation(selectedDate)}
            />

            <WeeklyMenuModal
                visible={showWeeklyPopup}
                onClose={() => dispatch(toggleWeeklyPopup())}
                startDate={selectedDate}
            />

            <MonthlyMenuModal
                visible={showMonthlyPopup}
                onClose={() => dispatch(toggleMonthlyPopup())}
                month={currentMonth}
            />
        </div>
    );
};

export default MenuView;