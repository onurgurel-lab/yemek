import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Tabs, Input, Row, Col, Badge, Tag, Empty, Spin, Button, Typography, Space, Tooltip, Statistic, Rate } from 'antd';
import { SearchOutlined, CalendarOutlined, FireOutlined, LeftOutlined, RightOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
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
import { menuPointService, dayPointService } from '@/services/evaluationService';
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
 * Her yemek yanında ortalama puan ve değerlendirme butonu gösterilir.
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

    // ✅ Yemek puanları için state
    const [menuRatings, setMenuRatings] = useState({}); // { menuId: { average, count, userRating } }
    const [ratingsLoading, setRatingsLoading] = useState(false);

    // Refs for preventing infinite loops
    const isInitializedRef = useRef(false);
    const previousDateRef = useRef(null);

    // ✅ FIX: userId'yi doğru şekilde al (id veya uId)
    const userId = user?.id || user?.uId;
    const userName = user?.userName || user?.fullName || user?.name || 'Kullanıcı';

    /**
     * Tüm menü itemları için puan bilgilerini yükle
     * Eski koddaki loadExistingData mantığı
     */
    const loadMenuRatings = useCallback(async (menuItems) => {
        if (!menuItems || menuItems.length === 0) return;

        setRatingsLoading(true);
        try {
            const ratings = {};

            // Kullanıcının tüm puanlarını bir kerede çek
            let userPoints = [];
            if (userId) {
                try {
                    const userPointsResponse = await menuPointService.getByUser(userId);
                    userPoints = userPointsResponse?.data || userPointsResponse || [];
                    if (!Array.isArray(userPoints)) userPoints = [];
                } catch (error) {
                    console.error('Kullanıcı puanları yüklenemedi:', error);
                }
            }

            // Her menü item için puan bilgilerini çek
            for (const item of menuItems) {
                try {
                    // Menüye ait tüm puanları çek
                    const pointsResponse = await menuPointService.getByMenuId(item.id);
                    const points = pointsResponse?.data || pointsResponse || [];
                    const pointsArray = Array.isArray(points) ? points : [];

                    // Ortalama hesapla
                    let average = 0;
                    if (pointsArray.length > 0) {
                        const sum = pointsArray.reduce((acc, p) => acc + (p.point || 0), 0);
                        average = Math.round((sum / pointsArray.length) * 10) / 10;
                    }

                    // Kullanıcının bu yemeğe verdiği puanı bul
                    const userRating = userPoints.find(p => p.mealMenuId === item.id);

                    ratings[item.id] = {
                        average: average,
                        count: pointsArray.length,
                        userRating: userRating?.point || 0,
                        userPointId: userRating?.id || null,
                        hasUserRated: !!userRating
                    };
                } catch (error) {
                    console.error(`Menü ${item.id} için puan yüklenemedi:`, error);
                    ratings[item.id] = { average: 0, count: 0, userRating: 0, hasUserRated: false };
                }
            }

            setMenuRatings(ratings);
        } catch (error) {
            console.error('Puan bilgileri yüklenirken hata:', error);
        } finally {
            setRatingsLoading(false);
        }
    }, [userId]);

    // Check if user has existing evaluation for a specific date
    const checkExistingEvaluation = useCallback(async (dateToCheck) => {
        if (!userId || !dateToCheck) {
            setHasExistingEvaluation(false);
            return;
        }

        try {
            const response = await dayPointService.getByUser(userId);
            const points = response?.data || response || [];
            const pointsArray = Array.isArray(points) ? points : [];

            const formattedDate = dayjs(dateToCheck).format('YYYY-MM-DD');
            const userPoint = pointsArray.find(p => {
                const pointDate = dayjs(p.pointDate).format('YYYY-MM-DD');
                return pointDate === formattedDate;
            });

            setHasExistingEvaluation(!!userPoint);
        } catch (error) {
            console.error('Değerlendirme kontrolü hatası:', error);
            setHasExistingEvaluation(false);
        }
    }, [userId]);

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

    // Fetch menu when date changes (but not on initial mount)
    useEffect(() => {
        if (!selectedDate || !isInitializedRef.current) return;

        // Skip if same date
        if (previousDateRef.current === selectedDate) return;
        previousDateRef.current = selectedDate;

        dispatch(fetchMenuByDate(selectedDate));
        checkExistingEvaluation(selectedDate);
    }, [selectedDate, dispatch, checkExistingEvaluation]);

    // ✅ Menü verisi değiştiğinde puanları yükle
    useEffect(() => {
        if (menuData && menuData.length > 0) {
            loadMenuRatings(menuData);
        }
    }, [menuData, loadMenuRatings]);

    // Generate calendar days (42 days for 6 weeks)
    const calendarDays = useMemo(() => {
        const days = [];
        const monthStart = dayjs(currentMonth + '-01');

        // Ayın ilk gününün haftanın hangi günü olduğunu bul
        // dayjs.day(): 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        // Biz Pazartesi=0, Salı=1, ..., Pazar=6 istiyoruz
        const firstDayOfWeek = monthStart.day(); // 0-6 (Pazar-Cumartesi)
        const mondayBasedDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Pazartesi=0 bazlı

        // Grid'in başlangıcı: ayın 1'inden önceki Pazartesi
        const startDay = monthStart.subtract(mondayBasedDay, 'day');

        for (let i = 0; i < 42; i++) {
            const date = startDay.add(i, 'day');
            const dayOfWeek = date.day(); // 0=Pazar, 6=Cumartesi

            days.push({
                date: date.format('YYYY-MM-DD'),
                day: date.date(),
                isCurrentMonth: date.month() === monthStart.month(),
                isToday: date.isSame(dayjs(), 'day'),
                isSelected: date.format('YYYY-MM-DD') === selectedDate,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6 // Pazar veya Cumartesi
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
        return filteredMenu.reduce((total, item) => total + (item.calories || item.calorie || 0), 0);
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
    }, [dispatch]);

    const selectDate = useCallback((dateString) => {
        dispatch(setSelectedDate(dateString));
    }, [dispatch]);

    // Search handling
    const handleSearch = useCallback((value) => {
        dispatch(setSearchTerm(value));
        if (value && value.trim().length >= 2) {
            dispatch(searchFood(value.trim()));
        } else {
            dispatch(clearSearchResults());
        }
    }, [dispatch]);

    const goToDateFromSearch = useCallback((dateString) => {
        const month = dayjs(dateString).format('YYYY-MM');
        dispatch(setCurrentMonth(month));
        dispatch(setSelectedDate(dateString));
        dispatch(clearSearchResults());
        dispatch(setSearchTerm(''));
    }, [dispatch]);

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
        // Puanları yeniden yükle
        if (menuData && menuData.length > 0) {
            loadMenuRatings(menuData);
        }
    }, [dispatch, selectedDate, menuData, loadMenuRatings]);

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

    // MonthlyMenuModal için year ve month değerlerini hesapla
    const monthlyModalYear = useMemo(() => {
        return dayjs(currentMonth + '-01').year();
    }, [currentMonth]);

    const monthlyModalMonth = useMemo(() => {
        return dayjs(currentMonth + '-01').month(); // 0-11 indeksli
    }, [currentMonth]);

    // Tab items
    const tabItems = [
        { key: 'lunch', label: '🍽️ Öğle Yemeği' },
        { key: 'dinner', label: '🌙 Akşam Yemeği' }
    ];

    /**
     * Yemek için puan bilgisini al
     * @param {number} menuId - Menü ID
     * @returns {Object} { average, count, userRating, hasUserRated }
     */
    const getMenuRatingInfo = useCallback((menuId) => {
        return menuRatings[menuId] || { average: 0, count: 0, userRating: 0, hasUserRated: false };
    }, [menuRatings]);

    /**
     * Yıldız render fonksiyonu (eski koddaki gibi)
     */
    const renderStars = useCallback((rating) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        style={{
                            color: star <= rating ? '#faad14' : '#d9d9d9',
                            fontSize: 14
                        }}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    }, []);

    /**
     * Buton metnini belirle (eski koddaki gibi)
     */
    const getButtonText = useCallback((hasUserRated, isToday) => {
        if (!isToday && hasUserRated) return 'Değerlendirildi';
        if (isToday && hasUserRated) return 'Düzenle';
        return 'Değerlendir';
    }, []);

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
                                                ? '#d9d9d9'
                                                : day.isWeekend
                                                    ? '#ff4d4f'
                                                    : '#000',
                                        border: day.isToday && !day.isSelected ? '1px solid #1890ff' : 'none',
                                        fontWeight: day.isToday ? 'bold' : 'normal'
                                    }}
                                >
                                    {day.day}
                                </div>
                            ))}
                        </div>

                        {/* View Mode Buttons */}
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <Button
                                block
                                onClick={() => dispatch(toggleWeeklyPopup())}
                            >
                                📅 Haftalık
                            </Button>
                            <Button
                                block
                                onClick={() => dispatch(toggleMonthlyPopup())}
                            >
                                🗓️ Aylık
                            </Button>
                        </div>
                    </Card>
                </Col>

                {/* Right - Menu */}
                <Col xs={24} lg={16}>
                    <Card>
                        {/* Search */}
                        <Search
                            placeholder="Yemek ara..."
                            prefix={<SearchOutlined />}
                            allowClear
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            loading={searchLoading}
                            style={{ marginBottom: 16 }}
                        />

                        {/* Search Results */}
                        {showSearchResults && searchResults && searchResults.length > 0 && (
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
                                        onClick={() => goToDateFromSearch(item.menuDate || item.date)}
                                    >
                                        <Space>
                                            <Tag color={getCategoryColor(item.category)}>{item.category}</Tag>
                                            <span>{item.foodName}</span>
                                            <Text type="secondary">
                                                {dayjs(item.menuDate || item.date).format('DD.MM.YYYY')}
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
                        ) : groupedMenu.length === 0 ? (
                            <Empty description="Bu tarih için menü bulunamadı" />
                        ) : (
                            <>
                                {/* Stats */}
                                <div style={{
                                    display: 'flex',
                                    gap: 24,
                                    marginBottom: 16,
                                    padding: 12,
                                    background: '#fafafa',
                                    borderRadius: 8
                                }}>
                                    <Statistic
                                        title="Toplam Yemek"
                                        value={filteredMenu.length}
                                        suffix="çeşit"
                                    />
                                    {totalCalories > 0 && (
                                        <Statistic
                                            title="Toplam Kalori"
                                            value={totalCalories}
                                            suffix="kcal"
                                            prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                                        />
                                    )}
                                </div>

                                {/* Menu Items by Category */}
                                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                                    {groupedMenu.map(([category, items]) => (
                                        <Card
                                            key={category}
                                            size="small"
                                            title={
                                                <Space>
                                                    <span>{getCategoryIcon(category)}</span>
                                                    <span>{category}</span>
                                                    <Badge count={items.length} style={{ backgroundColor: getCategoryColor(category) }} />
                                                </Space>
                                            }
                                        >
                                            {items.map((item, idx) => {
                                                const ratingInfo = getMenuRatingInfo(item.id);
                                                const buttonText = getButtonText(ratingInfo.hasUserRated, isTodaySelected);

                                                return (
                                                    <div
                                                        key={item.id || idx}
                                                        style={{
                                                            padding: '12px 0',
                                                            borderBottom: idx < items.length - 1 ? '1px dashed #f0f0f0' : 'none',
                                                        }}
                                                    >
                                                        {/* Yemek Adı ve Kalori */}
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                                                                {item.foodName}
                                                            </Text>

                                                            {/* Kalori */}
                                                            {(item.calories || item.calorie) > 0 && (
                                                                <Tag icon={<FireOutlined />} color="orange" size="small">
                                                                    {item.calories || item.calorie} kcal
                                                                </Tag>
                                                            )}
                                                        </div>

                                                        {/* Puan ve Değerlendirme Butonu - Her zaman alt satırda */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexWrap: 'wrap',
                                                            gap: 8
                                                        }}>
                                                            {/* Yıldız Ortalaması ve Oy Sayısı */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                {ratingsLoading ? (
                                                                    <Spin size="small" />
                                                                ) : (
                                                                    <>
                                                                        {renderStars(Math.round(ratingInfo.average))}
                                                                        <Text
                                                                            type="secondary"
                                                                            style={{ fontSize: 12 }}
                                                                        >
                                                                            {ratingInfo.average > 0 ? (
                                                                                <>
                                                                                    <Text strong style={{ color: '#faad14' }}>
                                                                                        {ratingInfo.average}
                                                                                    </Text>
                                                                                    {' '}({ratingInfo.count})
                                                                                </>
                                                                            ) : (
                                                                                <span style={{ color: '#bfbfbf' }}>Henüz oy yok</span>
                                                                            )}
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Değerlendirme Butonu */}
                                                            <Tooltip
                                                                title={
                                                                    !isTodaySelected
                                                                        ? 'Geçmiş tarihlerdeki menülere değerlendirme yapılamaz'
                                                                        : ratingInfo.hasUserRated
                                                                            ? 'Değerlendirmeyi düzenle'
                                                                            : 'Puan ver ve yorum yap'
                                                                }
                                                            >
                                                                <Button
                                                                    type={ratingInfo.hasUserRated ? 'primary' : 'default'}
                                                                    size="small"
                                                                    icon={<span style={{ marginRight: 4 }}>⭐</span>}
                                                                    onClick={() => openRatingModal(item)}
                                                                    disabled={!isTodaySelected}
                                                                    style={{
                                                                        borderColor: isTodaySelected && !ratingInfo.hasUserRated ? '#faad14' : undefined,
                                                                        color: isTodaySelected && !ratingInfo.hasUserRated ? '#faad14' : undefined,
                                                                        opacity: !isTodaySelected ? 0.6 : 1
                                                                    }}
                                                                >
                                                                    {buttonText}
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </Card>
                                    ))}
                                </div>

                                {/* Day Evaluation Button - Only for today */}
                                {isTodaySelected && userId && (
                                    <Button
                                        type={hasExistingEvaluation ? 'default' : 'primary'}
                                        icon={<StarOutlined />}
                                        onClick={() => dispatch(toggleDayEvaluationPopup())}
                                        style={{ marginTop: 16 }}
                                        block
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

            {/* MonthlyMenuModal'a year ve month ayrı ayrı gönder */}
            <MonthlyMenuModal
                visible={showMonthlyPopup}
                onClose={() => dispatch(toggleMonthlyPopup())}
                year={monthlyModalYear}
                month={monthlyModalMonth}
            />
        </div>
    );
};

export default Dashboard;