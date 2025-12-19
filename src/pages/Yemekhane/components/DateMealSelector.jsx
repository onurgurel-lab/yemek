/**
 * DateMealSelector.jsx - Tarih ve Öğün Seçici Component
 *
 * Eski projedeki DateMealSelector'ın Ant Design uyarlaması
 * Tarih seçimi ve öğün (öğle/akşam) seçimi için kullanılır
 *
 * @module pages/Yemekhane/components/DateMealSelector
 */

import React, { useMemo } from 'react';
import {
    Card,
    DatePicker,
    Segmented,
    Space,
    Typography,
    Row,
    Col,
    Button,
    Statistic,
    Divider,
    Tag,
    Tooltip,
} from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    FireOutlined,
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { MEAL_TIMES } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text, Title } = Typography;

/**
 * DateMealSelector Component
 *
 * @param {Object} props
 * @param {string} props.selectedDate - Seçili tarih (YYYY-MM-DD formatında)
 * @param {Function} props.onDateChange - Tarih değişikliği callback'i
 * @param {number} props.selectedMealTime - Seçili öğün (1: Öğle, 2: Akşam)
 * @param {Function} props.onMealTimeChange - Öğün değişikliği callback'i
 * @param {Array} props.menuData - Menü verileri (istatistik için)
 * @param {boolean} props.disablePastDates - Geçmiş tarihleri devre dışı bırak
 * @param {boolean} props.showStats - İstatistikleri göster
 * @param {boolean} props.showQuickNav - Hızlı navigasyon butonlarını göster
 * @param {string} props.size - Component boyutu ('small', 'default', 'large')
 */
const DateMealSelector = ({
                              selectedDate,
                              onDateChange,
                              selectedMealTime = MEAL_TIMES.LUNCH,
                              onMealTimeChange,
                              menuData = [],
                              disablePastDates = false,
                              showStats = true,
                              showQuickNav = true,
                              size = 'default',
                          }) => {
    /**
     * Öğün seçenekleri
     */
    const mealOptions = [
        {
            label: (
                <Space>
                    <span>🌞</span>
                    <span>Öğle Yemeği</span>
                </Space>
            ),
            value: MEAL_TIMES.LUNCH,
        },
        {
            label: (
                <Space>
                    <span>🌙</span>
                    <span>Akşam Yemeği</span>
                </Space>
            ),
            value: MEAL_TIMES.DINNER,
        },
    ];

    /**
     * Seçili öğüne göre filtrelenmiş menü
     */
    const filteredMenu = useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        return menuData.filter((item) => item.mealTime === selectedMealTime);
    }, [menuData, selectedMealTime]);

    /**
     * Toplam kalori hesaplama
     */
    const totalCalories = useMemo(() => {
        return filteredMenu.reduce((sum, item) => sum + (item.calories || 0), 0);
    }, [filteredMenu]);

    /**
     * Geçmiş tarihler için DatePicker disable
     */
    const disabledDate = (current) => {
        if (!disablePastDates) return false;
        return current && current < dayjs().startOf('day');
    };

    /**
     * Tarih değişikliği handler
     */
    const handleDateChange = (date) => {
        if (date && onDateChange) {
            onDateChange(date);
        }
    };

    /**
     * Bugüne git
     */
    const goToToday = () => {
        if (onDateChange) {
            onDateChange(dayjs());
        }
    };

    /**
     * Bir gün ileri
     */
    const goToNextDay = () => {
        if (selectedDate && onDateChange) {
            onDateChange(dayjs(selectedDate).add(1, 'day'));
        }
    };

    /**
     * Bir gün geri
     */
    const goToPrevDay = () => {
        if (selectedDate && onDateChange) {
            const prevDay = dayjs(selectedDate).subtract(1, 'day');
            if (!disablePastDates || prevDay.isAfter(dayjs().subtract(1, 'day'))) {
                onDateChange(prevDay);
            }
        }
    };

    /**
     * Tarih formatı
     */
    const formattedDate = useMemo(() => {
        if (!selectedDate) return 'Tarih seçin';
        return dayjs(selectedDate).format('DD MMMM YYYY, dddd');
    }, [selectedDate]);

    /**
     * Bugün mü kontrolü
     */
    const isToday = useMemo(() => {
        if (!selectedDate) return false;
        return dayjs(selectedDate).isSame(dayjs(), 'day');
    }, [selectedDate]);

    return (
        <Card className="date-meal-selector" size={size}>
            {/* Başlık */}
            <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>
                    <CalendarOutlined className="mr-2" />
                    Tarih ve Öğün Seçimi
                </Title>
                <Text type="secondary">Menü yönetimi için tarih ve öğün türünü seçin</Text>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 16]} align="middle">
                {/* Tarih Seçimi */}
                <Col xs={24} md={showStats ? 10 : 12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>📅 Tarih:</Text>
                        <Space.Compact style={{ width: '100%' }}>
                            {showQuickNav && (
                                <Tooltip title="Önceki Gün">
                                    <Button
                                        icon={<LeftOutlined />}
                                        onClick={goToPrevDay}
                                        disabled={
                                            disablePastDates &&
                                            dayjs(selectedDate)
                                                .subtract(1, 'day')
                                                .isBefore(dayjs().startOf('day'))
                                        }
                                    />
                                </Tooltip>
                            )}
                            <DatePicker
                                value={selectedDate ? dayjs(selectedDate) : null}
                                onChange={handleDateChange}
                                disabledDate={disabledDate}
                                format="DD MMMM YYYY"
                                style={{ flex: 1 }}
                                placeholder="Tarih seçin"
                                allowClear={false}
                                size={size === 'large' ? 'large' : 'middle'}
                            />
                            {showQuickNav && (
                                <Tooltip title="Sonraki Gün">
                                    <Button icon={<RightOutlined />} onClick={goToNextDay} />
                                </Tooltip>
                            )}
                        </Space.Compact>

                        {showQuickNav && (
                            <Button
                                type="link"
                                size="small"
                                onClick={goToToday}
                                disabled={isToday}
                                style={{ padding: 0 }}
                            >
                                Bugüne Git
                            </Button>
                        )}

                        {/* Seçili Tarih Gösterimi */}
                        {selectedDate && (
                            <div
                                style={{
                                    background: '#f5f5f5',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    marginTop: 8,
                                }}
                            >
                                <Space>
                                    <CalendarOutlined style={{ color: '#1890ff' }} />
                                    <Text strong>{formattedDate}</Text>
                                    {isToday && (
                                        <Tag color="blue" size="small">
                                            Bugün
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                        )}
                    </Space>
                </Col>

                {/* Öğün Seçimi */}
                <Col xs={24} md={showStats ? 8 : 12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>🍽️ Öğün Türü:</Text>
                        <Segmented
                            value={selectedMealTime}
                            onChange={onMealTimeChange}
                            options={mealOptions}
                            block
                            size={size === 'large' ? 'large' : 'middle'}
                        />
                    </Space>
                </Col>

                {/* İstatistikler */}
                {showStats && (
                    <Col xs={24} md={6}>
                        <Row gutter={[8, 8]}>
                            <Col span={12}>
                                <Statistic
                                    title="Yemek Sayısı"
                                    value={filteredMenu.length}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ fontSize: 20 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Toplam Kalori"
                                    value={totalCalories}
                                    suffix="kcal"
                                    prefix={<FireOutlined />}
                                    valueStyle={{ fontSize: 20 }}
                                />
                            </Col>
                        </Row>
                    </Col>
                )}
            </Row>

            {/* Seçim Özeti */}
            {selectedDate && selectedMealTime && (
                <>
                    <Divider style={{ margin: '16px 0 12px 0' }} />
                    <div
                        style={{
                            background: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        <div>
                            <Text strong style={{ color: '#52c41a' }}>
                                Seçim Tamamlandı
                            </Text>
                            <br />
                            <Text>
                                {formattedDate} -{' '}
                                {selectedMealTime === MEAL_TIMES.LUNCH
                                    ? '🌞 Öğle Yemeği'
                                    : '🌙 Akşam Yemeği'}
                            </Text>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
};

export default DateMealSelector;