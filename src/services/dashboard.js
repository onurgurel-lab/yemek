import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Tabs, Input, Row, Col, Badge, Tag, Empty, Spin, Button, Typography, Space, Tooltip, Statistic } from 'antd';
import { SearchOutlined, CalendarOutlined, FireOutlined, LeftOutlined, RightOutlined, StarOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
import MenuRating from '@/pages/Yemekhane/components/MenuRating';
import DayEvaluationModal from '@/pages/Yemekhane/components/DayEvaluationModal';
import WeeklyMenuModal from '@/pages/Yemekhane/components/WeeklyMenuModal';
import MonthlyMenuModal from '@/pages/Yemekhane/components/MonthlyMenuModal';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;
const { Search } = Input;

/**
 * Dashboard - Yemek Menüsü Entegre Dashboard
 *
 * Sol tarafta takvim, sağ tarafta günlük menü görünümü.
 * Öğle ve akşam yemeği tabları, arama, değerlendirme özellikleri içerir.
 *
 * @returns {JSX.Element} Dashboard
 */
const Dashboard = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { user } = useAuth();

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

    // Ref to track if component has been initialized
    const isInitializedRef = useRef(false);

    // Check if user has existing evaluation for a specific date
    const checkExistingEvaluation = useCallback(async (dateToCheck) => {
        if (!user?.uId || !dateToCheck) {
            setHasExistingEvaluation(false);
            return;
        }

        try {
            const response = await dayPointService.getByDate(dateToCheck);
            const points = response?.data || [];
            const userPoint = points.find(p => p.uId === user.uId);
            setHasExistingEvaluation(!!userPoint);
        } catch (error) {
            setHasExistingEvaluation(false);
        }
    }, [user?.uId]);

    // Initialize on mount - runs only once
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const today = dayjs().format('YYYY-MM-DD');
        const month = dayjs().format('YYYY-MM');

        // Set initial state
        dispatch(setSelectedDate(today));
        dispatch(setCurrentMonth(month));
        dispatch(setActiveTab(getDefaultMealTab()));

        // Fetch today's menu
        dispatch(fetchTodayMenu());

        // Check evaluation
        checkExistingEvaluation(today);
    }, [dispatch, checkExistingEvaluation]);

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

    // Group by category
    const groupedMenu = useMemo(() => {
        const groups = {};

        filteredMenu.forEach(item => {
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
    }, [filteredMenu]);

    // Calculate total calories
    const totalCalories = useMemo(() => {
        return filteredMenu.reduce((total, item) => total + (item.calorie || 0), 0);
    }, [filteredMenu]);

    // Navigation
    const goToPrevMonth = useCallback(() => {
        const prev = dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM');
        dispatch(setCurrentMonth(prev));
    }, [currentMonth, dispatch]);

    const goToNextMonth = useCallback(() => {
        const next = dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM');
        dispatch(setCurrentMonth(next));
    }, [currentMonth, dispatch]);

    const goToToday = useCallback(() => {
        const today = dayjs().format('YYYY-MM-DD');
        const month = dayjs().format('YYYY-MM');
        dispatch(setCurrentMonth(month));
        dispatch(setSelectedDate(today));
        dispatch(fetchMenuByDate(today));
        checkExistingEvaluation(today);
    }, [dispatch, checkExistingEvaluation]);

    // Select a date from calendar
    const selectDate = useCallback((dateString) => {
        dispatch(setSelectedDate(dateString));
        dispatch(fetchMenuByDate(dateString));
        checkExistingEvaluation(dateString);
    }, [dispatch, checkExistingEvaluation]);

    // Search handling
    const handleSearch = useCallback((value) => {
        dispatch(setSearchTerm(value));
        if (value.trim().length >= 2) {
            dispatch(searchFood(value.trim()));
        } else {
            dispatch(clearSearchResults());
        }
    }, [dispatch]);

    const goToDateFromSearch = useCallback((dateString) => {
        const month = dayjs(dateString).format('YYYY-MM');
        dispatch(setCurrentMonth(month));
        dispatch(setSelectedDate(dateString));
        dispatch(fetchMenuByDate(dateString));
        dispatch(clearSearchResults());
        dispatch(setSearchTerm(''));
        checkExistingEvaluation(dateString);
    }, [dispatch, checkExistingEvaluation]);

    // Open rating modal
    const openRatingModal = useCallback((item) => {
        setSelectedMenuItem(item);
        setShowRatingModal(true);
    }, []);

    // Close rating modal
    const closeRatingModal = useCallback(() => {
        setShowRatingModal(false);
        setSelectedMenuItem(null);
    }, []);

    // Handle menu update after rating
    const handleMenuUpdate = useCallback(() => {
        if (selectedDate) {
            dispatch(fetchMenuByDate(selectedDate));
        }
    }, [dispatch, selectedDate]);

    // Handle day evaluation update
    const handleEvaluationUpdate = useCallback(() => {
        if (selectedDate) {
            checkExistingEvaluation(selectedDate);
        }
    }, [selectedDate, checkExistingEvaluation]);

    // Get month title
    const getMonthTitle = useCallback(() => {
        const monthDate = dayjs(currentMonth + '-01');
        return `${MONTH_NAMES[monthDate.month()]} ${monthDate.year()}`;
    }, [currentMonth]);

    // Check if selected date is today
    const isTodaySelected = useMemo(() => {
        return checkIsToday(selectedDate);
    }, [selectedDate]);

    // Formatted selected date
    const formattedSelectedDate = useMemo(() => {
        return dayjs(selectedDate).format('DD MMMM YYYY dddd');
    }, [selectedDate]);

    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle Yemeği' },
        { key: 'dinner', label: '🌙 Akşam Yemeği' }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                {/* Left - Calendar */}
                <Col xs={24} lg={8}>
                    <Card>
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Button icon={<LeftOutlined />} onClick={goToPrevMonth} />
                            <Title level={4} style={{ margin: 0 }}>{getMonthTitle()}</Title>
                            <Button icon={<RightOutlined />} onClick={goToNextMonth} />
                        </div>

                        {/* Today Button */}
                        <Button
                            type="link"
                            onClick={goToToday}
                            style={{ marginBottom: 8, padding: 0 }}
                        >
                            Bugüne Git
                        </Button>

                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                            {DAY_NAMES.map((day, idx) => (
                                <div
                                    key={day}
                                    style={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        padding: 4,
                                        color: idx >= 5 ? '#fa8c16' : '#000'
                                    }}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                            {calendarDays.map((day) => (
                                <div
                                    key={day.date}
                                    onClick={() => selectDate(day.date)}
                                    style={{
                                        textAlign: 'center',
                                        padding: 8,
                                        cursor: 'pointer',
                                        borderRadius: 4,
                                        backgroundColor: day.isSelected
                                            ? '#1890ff'
                                            : day.isToday
                                                ? '#e6f7ff'
                                                : 'transparent',
                                        color: day.isSelected
                                            ? '#fff'
                                            : !day.isCurrentMonth
                                                ? '#bfbfbf'
                                                : day.isWeekend
                                                    ? '#fa8c16'
                                                    : '#000',
                                        fontWeight: day.isToday ? 'bold' : 'normal',
                                        border: day.isToday && !day.isSelected ? '1px solid #1890ff' : 'none'
                                    }}
                                >
                                    {day.day}
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <Space style={{ marginTop: 16, width: '100%' }} direction="vertical">
                            <Button
                                block
                                icon={<CalendarOutlined />}
                                onClick={() => dispatch(toggleWeeklyPopup())}
                            >
                                Haftalık Görünüm
                            </Button>
                            <Button
                                block
                                icon={<CalendarOutlined />}
                                onClick={() => dispatch(toggleMonthlyPopup())}
                            >
                                Aylık Görünüm
                            </Button>
                        </Space>
                    </Card>
                </Col>

                {/* Right - Menu */}
                <Col xs={24} lg={16}>
                    <Card>
                        {/* Search */}
                        <Search
                            placeholder="Yemek ara..."
                            allowClear
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            loading={searchLoading}
                            style={{ marginBottom: 16 }}
                        />

                        {/* Search Results */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div style={{
                                marginBottom: 16,
                                padding: 12,
                                background: '#fafafa',
                                borderRadius: 8,
                                maxHeight: 200,
                                overflow: 'auto'
                            }}>
                                <Text strong style={{ marginBottom: 8, display: 'block' }}>Arama Sonuçları:</Text>
                                {searchResults.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        style={{
                                            padding: '4px 0',
                                            cursor: 'pointer',
                                            borderBottom: '1px dashed #f0f0f0'
                                        }}
                                        onClick={() => goToDateFromSearch(item.menuDate)}
                                    >
                                        <Space>
                                            <Tag color={getCategoryColor(item.category)}>{item.category}</Tag>
                                            <span>{item.foodName}</span>
                                            <Text type="secondary">
                                                {dayjs(item.menuDate).format('DD.MM.YYYY')}
                                            </Text>
                                        </Space>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Date Info */}
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <Title level={4} style={{ margin: 0 }}>
                                    {formattedSelectedDate}
                                </Title>
                                {isTodaySelected && <Badge status="success" text="Bugün" />}
                            </Space>
                        </div>

                        {/* Tabs */}
                        <Tabs
                            activeKey={activeTab}
                            onChange={(key) => dispatch(setActiveTab(key))}
                            items={tabItems}
                        />

                        {/* Menu Content */}
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
                                        {items.map((item) => (
                                            <Card
                                                key={item.id}
                                                size="small"
                                                style={{ marginBottom: 8 }}
                                                hoverable
                                                onClick={() => openRatingModal(item)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Space>
                                                        <Text>{item.foodName}</Text>
                                                        {item.averageRating > 0 && (
                                                            <Tooltip title={`Ortalama: ${item.averageRating.toFixed(1)}`}>
                                                                <Tag color="gold">
                                                                    <StarOutlined /> {item.averageRating.toFixed(1)}
                                                                </Tag>
                                                            </Tooltip>
                                                        )}
                                                    </Space>
                                                    {item.calorie > 0 && (
                                                        <Text type="secondary">
                                                            <FireOutlined style={{ color: '#fa8c16' }} /> {item.calorie} kcal
                                                        </Text>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ))}

                                {/* Total Calories */}
                                {totalCalories > 0 && (
                                    <div style={{
                                        marginTop: 16,
                                        padding: 12,
                                        background: '#fff7e6',
                                        borderRadius: 8,
                                        textAlign: 'center'
                                    }}>
                                        <Statistic
                                            title="Toplam Kalori"
                                            value={totalCalories}
                                            suffix="kcal"
                                            prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
                                        />
                                    </div>
                                )}

                                {/* Day Evaluation Button */}
                                {isTodaySelected && (
                                    <Button
                                        type="primary"
                                        block
                                        style={{ marginTop: 16 }}
                                        icon={<StarOutlined />}
                                        onClick={() => dispatch(toggleDayEvaluationPopup())}
                                    >
                                        {hasExistingEvaluation ? 'Gün Değerlendirmesini Düzenle' : 'Günü Değerlendir'}
                                    </Button>
                                )}
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            <MenuRating
                menuItem={selectedMenuItem}
                visible={showRatingModal}
                onClose={closeRatingModal}
                onUpdate={handleMenuUpdate}
            />

            <DayEvaluationModal
                visible={showDayEvaluationPopup}
                onClose={() => dispatch(toggleDayEvaluationPopup())}
                date={selectedDate}
                onUpdate={handleEvaluationUpdate}
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

export default Dashboard;